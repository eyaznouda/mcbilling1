const pool = require('../../config/database');

// Display all vouchers
const afficher = async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();
    try {
      const [results] = await connection.query('SELECT * FROM pkg_voucher ORDER BY creationdate DESC');
      res.json({ vouchers: results });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

// Display all plans
const afficherPlans = async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();
    try {
      const [results] = await connection.query('SELECT * FROM pkg_plan ORDER BY name ASC');
      if (results.length === 0) {
        return res.status(404).json({ message: "No plans found" });
      }
      res.json({ plans: results });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Database error" });
  }
};

// Add a new voucher
const ajouter = async (req, res) => {
  try {
    const connection = await pool.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 1. Strict validation
      const requiredFields = ['credit', 'id_plan', 'language'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // 2. Type validation
      if (typeof req.body.credit !== 'number' || typeof req.body.id_plan !== 'number') {
        throw new Error('Credit and Plan must be numbers');
      }

      // 3. Validate optional fields
      if (req.body.prefix_local && typeof req.body.prefix_local !== 'string') {
        throw new Error('prefix_local must be a string');
      }
      if (req.body.tag && typeof req.body.tag !== 'string') {
        throw new Error('tag must be a string');
      }

      // 3. Plan verification
      const [plan] = await connection.query(
        'SELECT id, name FROM pkg_plan WHERE id = ? FOR UPDATE',
        [req.body.id_plan]
      );
      
      if (!plan.length) {
        throw new Error(`Plan ${req.body.id_plan} does not exist`);
      }

      // 4. Prepare data
      const voucherData = {
        id_user: req.user?.id || null,
        id_plan: parseInt(req.body.id_plan),
        credit: parseFloat(req.body.credit),
        used: parseInt(req.body.used || 0),
        language: req.body.language?.substring(0, 2) || 'fr',
        prefix_local: req.body.prefix_local?.substring(0, 10) || '',
        tag: req.body.tag || '',
        voucher: req.body.voucher ? parseInt(req.body.voucher) : Math.floor(Math.random() * 999999),
        creationdate: new Date(),
        usedate: req.body.usedate ? new Date(req.body.usedate) : null,
        expirationdate: req.body.expirationdate ? new Date(req.body.expirationdate) : null
      };

      // 5. Insert with validation
      const [result] = await connection.query(
        'INSERT INTO pkg_voucher SET ?',
        voucherData
      );

      await connection.commit();
      
      res.status(201).json({
        success: true,
        message: 'Voucher created successfully',
        data: {
          id: result.insertId,
          voucher_code: voucherData.voucher,
          plan_name: plan[0].name
        }
      });

    } catch (err) {
      await connection.rollback();
      
      console.error('[VOUCHER ERROR]', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        payload: req.body
      });
      
      res.status(400).json({
        success: false,
        error: err.message,
        code: 'VOUCHER_CREATION_FAILED'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

// Modify a voucher
const modifier = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Validate voucher exists
    const [existingVoucher] = await connection.query(
      'SELECT id FROM pkg_voucher WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (!existingVoucher.length) {
      throw new Error('Voucher not found');
    }

    // 2. Validate update data
    const updateData = {};
    
    if (req.body.credit !== undefined) {
      if (typeof req.body.credit !== 'number') {
        throw new Error('Credit must be a number');
      }
      updateData.credit = parseFloat(req.body.credit);
    }

    if (req.body.id_plan !== undefined) {
      if (typeof req.body.id_plan !== 'number') {
        throw new Error('Plan must be a number');
      }
      
      const [plan] = await connection.query(
        'SELECT id FROM pkg_plan WHERE id = ?',
        [req.body.id_plan]
      );
      
      if (!plan.length) {
        throw new Error(`Plan ${req.body.id_plan} does not exist`);
      }
      updateData.id_plan = parseInt(req.body.id_plan);
    }

    if (req.body.language) {
      updateData.language = req.body.language.substring(0, 2);
    }

    if (req.body.prefix_local) {
      updateData.prefix_local = req.body.prefix_local.substring(0, 10);
    }

    if (req.body.description) {
      updateData.description = req.body.description.substring(0, 255);
    }

    if (req.body.usedate) {
      updateData.usedate = new Date(req.body.usedate);
    }

    if (req.body.exprationdate) {
      updateData.exprationdate = new Date(req.body.exprationdate);
    }

    // 3. Update voucher
    const [result] = await connection.query(
      'UPDATE pkg_voucher SET ? WHERE id = ?',
      [updateData, req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new Error('No voucher updated');
    }

    await connection.commit();
    
    res.json({
      success: true,
      message: 'Voucher updated successfully',
      data: {
        id: req.params.id,
        changes: updateData
      }
    });

  } catch (err) {
    await connection.rollback();
    
    console.error('[VOUCHER ERROR]', {
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack,
      payload: req.body
    });
    
    res.status(400).json({
      success: false,
      error: err.message,
      code: 'VOUCHER_UPDATE_FAILED'
    });
  } finally {
    connection.release();
  }
};

// Delete a voucher
const del = (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM pkg_voucher WHERE id = ?', [id], (error) => {
        if (error) return res.status(500).json({ error });
        res.status(204).send();
    });
};

module.exports = { afficher, ajouter, del, modifier, afficherPlans };