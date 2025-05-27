const connection = require("../../config/dataBase");

// Get all user rates with joins
exports.afficher = (req, res) => {
  const query = `
    SELECT 
      ur.*, 
      u.username, 
      p.prefix, 
      p.destination
    FROM pkg_user_rate AS ur
    LEFT JOIN pkg_user AS u ON ur.id_user = u.id
    LEFT JOIN pkg_prefix AS p ON ur.id_prefix = p.id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erreur récupération user rates:", err.message);
      return res.status(500).json({ error: "Erreur base de données", details: err.message });
    }

    res.json({ userRates: results });
  });
};

// Add new user rate
exports.ajouter = (req, res) => {
  // Log the incoming request data
  console.log('Received data:', {
    raw: req.body,
    parsed: {
      id_user: Number(req.body.id_user),
      id_prefix: Number(req.body.id_prefix),
      rate: Number(req.body.rate),
      initblock: Number(req.body.initblock),
      billingblock: Number(req.body.billingblock)
    }
  });
  
  // Ensure we have all required fields
  if (!req.body.id_user || !req.body.id_prefix || !req.body.rate) {
    console.error('Missing required fields in request body:', req.body);
    return res.status(400).json({ 
      error: "Champs obligatoires manquants",
      details: "id_user, id_prefix et rate sont requis"
    });
  }

  const { id_user, id_prefix, rate, initblock, billingblock } = req.body;

  if (!id_user || !id_prefix || rate == null) {
    console.log('Missing required fields:', { id_user, id_prefix, rate });
    return res.status(400).json({ 
      error: "Champs obligatoires manquants",
      details: "id_user, id_prefix et rate sont requis"
    });
  }

  // Validate the data types
  const parsedData = {
    id_user: Number(id_user),
    id_prefix: Number(id_prefix),
    rate: Number(rate),
    initblock: Number(initblock),
    billingblock: Number(billingblock)
  };

  if (isNaN(parsedData.id_user) || isNaN(parsedData.id_prefix) || isNaN(parsedData.rate)) {
    console.log('Invalid data types:', parsedData);
    return res.status(400).json({ 
      error: "Types de données invalides",
      details: "id_user et id_prefix doivent être des nombres, rate doit être un nombre"
    });
  }

  // Check if user and prefix exist in database
  const checkUserQuery = `SELECT id FROM pkg_user WHERE id = ?`;
  const checkPrefixQuery = `SELECT id FROM pkg_prefix WHERE id = ?`;

  // Check user first
  connection.query(checkUserQuery, [parsedData.id_user], (err, userResults) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({
        error: "Erreur serveur",
        details: err.message
      });
    }

    if (userResults.length === 0) {
      return res.status(400).json({
        error: "Utilisateur invalide",
        details: "L'ID utilisateur spécifié n'existe pas dans la base de données"
      });
    }

    // Check prefix
    connection.query(checkPrefixQuery, [parsedData.id_prefix], (err, prefixResults) => {
      if (err) {
        console.error('Error checking prefix:', err);
        return res.status(500).json({
          error: "Erreur serveur",
          details: err.message
        });
      }

      if (prefixResults.length === 0) {
        return res.status(400).json({
          error: "Préfixe invalide",
          details: "L'ID préfixe spécifié n'existe pas dans la base de données"
        });
      }

      // Both user and prefix exist, proceed with insert
      const query = `
        INSERT INTO pkg_user_rate (id_user, id_prefix, rateinitial, initblock, billingblock)
        VALUES (?, ?, ?, ?, ?)
      `;
      console.log('Executing query:', query);
      console.log('With values:', [parsedData.id_user, parsedData.id_prefix, parsedData.rate]);

      connection.query(query, [parsedData.id_user, parsedData.id_prefix, parsedData.rate, parsedData.initblock, parsedData.billingblock], (err, result) => {
        if (err) {
          console.error("Erreur ajout user rate:", err);
          console.error("Error details:", {
            code: err.code,
            sqlMessage: err.sqlMessage,
            sql: err.sql
          });
          
          if (err.code === 'ER_DUP_ENTRY') {
            console.error('Duplicate entry error:', err);
            return res.status(400).json({ 
              error: "Enregistrement déjà existant",
              details: "Cette combinaison d'utilisateur et de préfixe existe déjà"
            });
          }
          
          return res.status(500).json({ 
            error: "Erreur base de données",
            details: err.message
          });
        }

        console.log('Insert successful:', result);
        console.log('Generated ID:', result.insertId);

        // Get the newly created rate with its associated data
        const getNewRateQuery = `
          SELECT ur.*, u.username, p.prefix, p.destination 
          FROM pkg_user_rate AS ur
          LEFT JOIN pkg_user AS u ON ur.id_user = u.id
          LEFT JOIN pkg_prefix AS p ON ur.id_prefix = p.id
          WHERE ur.id = ?
        `;

        connection.query(getNewRateQuery, [result.insertId], (err, results) => {
          if (err) {
            return handleError(res, err, "Erreur récupération des données:");
          }
          
          if (!results[0]) {
            console.error("No result found after insert:", { insertId: result.insertId });
            return res.status(500).json({ 
              error: "Erreur de données",
              details: "Enregistrement inséré mais non récupéré"
            });
          }
          
          console.log('Successfully created rate:', results[0]);
          res.status(201).json({ 
            message: "User rate ajouté avec succès", 
            rate: results[0]
          });
        });
      });
    });
  });
};

// Update user rate
exports.modifier = (req, res) => {
  const id = req.params.id;
  const { id_user, id_prefix, rate, initblock, billingblock } = req.body;

  // Validate required fields
  if (!id_user || !id_prefix || rate == null || initblock == null || billingblock == null) {
    return res.status(400).json({ 
      error: "Champs obligatoires manquants",
      details: "id_user, id_prefix, rate, initblock et billingblock sont requis"
    });
  }

  // Validate data types
  const parsedData = {
    id_user: Number(id_user),
    id_prefix: Number(id_prefix),
    rate: Number(rate),
    initblock: Number(initblock),
    billingblock: Number(billingblock)
  };

  if (isNaN(parsedData.id_user) || isNaN(parsedData.id_prefix) || isNaN(parsedData.rate) || 
      isNaN(parsedData.initblock) || isNaN(parsedData.billingblock)) {
    return res.status(400).json({ 
      error: "Types de données invalides",
      details: "Tous les champs doivent être des nombres"
    });
  }

  // Check if user exists
  const checkUserQuery = `SELECT id FROM pkg_user WHERE id = ?`;
  connection.query(checkUserQuery, [parsedData.id_user], (err, userResults) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({
        error: "Erreur serveur",
        details: err.message
      });
    }

    if (userResults.length === 0) {
      return res.status(400).json({
        error: "Utilisateur invalide",
        details: "L'ID utilisateur spécifié n'existe pas dans la base de données"
      });
    }

    // Check if prefix exists
    const checkPrefixQuery = `SELECT id FROM pkg_prefix WHERE id = ?`;
    connection.query(checkPrefixQuery, [parsedData.id_prefix], (err, prefixResults) => {
      if (err) {
        console.error('Error checking prefix:', err);
        return res.status(500).json({
          error: "Erreur serveur",
          details: err.message
        });
      }

      if (prefixResults.length === 0) {
        return res.status(400).json({
          error: "Préfixe invalide",
          details: "L'ID préfixe spécifié n'existe pas dans la base de données"
        });
      }

      // Update the rate
      const query = `
        UPDATE pkg_user_rate 
        SET id_user = ?, id_prefix = ?, rateinitial = ?, initblock = ?, billingblock = ?
        WHERE id = ?
      `;

      connection.query(query, [parsedData.id_user, parsedData.id_prefix, parsedData.rate, parsedData.initblock, parsedData.billingblock, id], (err, result) => {
        if (err) {
          console.error("Erreur modification user rate:", err);
          return res.status(500).json({ error: "Erreur base de données", details: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Rate non trouvé" });
        }

        // Get the updated rate with its associated data
        const getUpdatedRateQuery = `
          SELECT ur.*, u.username, p.prefix, p.destination 
          FROM pkg_user_rate AS ur
          LEFT JOIN pkg_user AS u ON ur.id_user = u.id
          LEFT JOIN pkg_prefix AS p ON ur.id_prefix = p.id
          WHERE ur.id = ?
        `;

        connection.query(getUpdatedRateQuery, [id], (err, results) => {
          if (err) {
            console.error("Erreur récupération des données:", err);
            return res.status(500).json({ error: "Erreur base de données", details: err.message });
          }

          if (!results[0]) {
            console.error("Rate non trouvé après mise à jour:", { id });
            return res.status(404).json({ error: "Rate non trouvé" });
          }

          res.json({ 
            message: "Rate mise à jour avec succès", 
            rate: results[0]
          });
        });
      });
    });
  });
};

// Delete user rate
exports.supprimer = (req, res) => {
  const id = req.params.id;

  connection.query("DELETE FROM pkg_user_rate WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Erreur suppression user rate:", err.message);
      return res.status(500).json({ error: "Erreur base de données", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User rate non trouvé" });
    }

    res.json({ message: "User rate supprimé avec succès" });
  });
};

// Get all usernames for dropdown
exports.getUsernames = (req, res) => {
  const query = `SELECT id, username FROM pkg_user ORDER BY username ASC`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erreur récupération usernames:", err.message);
      return res.status(500).json({ error: "Erreur base de données", details: err.message });
    }

    res.json({ usernames: results });
  });
};

// Get all prefixes for dropdown
exports.getPrefixes = (req, res) => {
  const query = `SELECT id, prefix, destination FROM pkg_prefix ORDER BY destination ASC`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erreur récupération prefixes:", err.message);
      return res.status(500).json({ error: "Erreur base de données", details: err.message });
    }

    res.json({ prefixes: results });
  });
};
