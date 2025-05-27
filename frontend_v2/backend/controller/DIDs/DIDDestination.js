const connection = require("../../config/dataBase");

// Afficher tous les DIDs
exports.afficher = async (req, res) => {
  try {
    const query = `
      SELECT 
        did.did AS did,  
        did_destination.voip_call AS Calltype, 
        did_destination.secondusedreal AS TimeUsed, 
        did_destination.priority AS Priority, 
        did_destination.creationdate AS CreationDate, 
        user.username 
      FROM 
        pkg_did_destination AS did_destination
      LEFT JOIN 
        pkg_user AS user 
        ON did_destination.id_user = user.id
      LEFT JOIN 
        pkg_did AS did 
        ON did_destination.id_did = did.id
      ORDER BY did.did ASC
      LIMIT 25;
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching DIDs data:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ dids: results });
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal server error");
  }
};

// Supprimer un DID par ID
exports.del = (req, res) => {
  const didId = req.params.id;
  const query = "DELETE FROM pkg_did_destination WHERE id = ?";

  connection.query(query, [didId], (err, result) => {
    if (err) {
      console.error("Error deleting DID record:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "DID record not found" });
    }

    res.status(200).json({ message: "DID record deleted successfully" });
  });
};

// Supprimer par numéro DID
exports.deleteByDid = (req, res) => {
  const didNumber = req.params.did;
  const query = "DELETE FROM pkg_did_destination WHERE id_did = (SELECT id FROM pkg_did WHERE did = ?)";
  
  connection.query(query, [didNumber], (err, result) => {
    if (err) {
      console.error("Error deleting DID:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "DID not found" });
    }
    
    res.json({ message: "DID deleted successfully" });
  });
};

// Afficher un DID par ID avec le username
exports.getById = async (req, res) => {
  const didId = req.params.id;

  try {
    const query = `
      SELECT 
        dids.id AS id, 
        dids.did AS DID, 
        dids.call_type AS Calltype, 
        dids.time_used AS TimeUsed, 
        dids.priority AS Priority, 
        dids.creation_date AS CreationDate,
        user.username 
      FROM 
        pkg_did_destination AS dids 
      LEFT JOIN 
        pkg_user AS user 
      ON 
        dids.id_user = user.id 
      WHERE 
        dids.id = ?
    `;

    connection.query(query, [didId], (err, result) => {
      if (err) {
        console.error("Error fetching DID data:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "DID not found" });
      }

      res.json({ did: result[0] });
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal server error");
  }
};

// Get all DIDs from pkg_did table
exports.getDIDs = async (req, res) => {
  try {
    const query = `SELECT did FROM pkg_did ORDER BY did ASC`;
    
    connection.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching DIDs:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ dids: results });
    });
  } catch (error) {
    console.error("Error fetching DIDs:", error);
    res.status(500).send("Internal server error");
  }
};

// Ajouter un nouveau DID destination
exports.add = (req, res) => {
    const { did, username, destinationType, priority, destination } = req.body;  

    // Check for missing fields
    if (!did || !username || destinationType === undefined || priority === undefined || !destination) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user ID from the username
    const getUserQuery = "SELECT id FROM pkg_user WHERE username = ?";
    connection.query(getUserQuery, [username], (userErr, userResults) => {
        if (userErr) {
            console.error("Error fetching user ID:", userErr);
            return res.status(500).json({ error: "Database error" });
        }

        if (userResults.length === 0) {
            return res.status(400).json({ error: "Invalid username" });
        }

        const userId = userResults[0].id;

        // Get DID ID from the DID
        const getDidQuery = "SELECT id FROM pkg_did WHERE did = ?";
        connection.query(getDidQuery, [did], (didErr, didResults) => {
            if (didErr) {
                console.error("Error fetching DID ID:", didErr);
                return res.status(500).json({ error: "Database error" });
            }

            if (didResults.length === 0) {
                return res.status(400).json({ error: "Invalid DID" });
            }

            const didId = didResults[0].id;

            // Insert new DID destination into the database
            const insertQuery = `
                INSERT INTO pkg_did_destination (id_did, id_user, voip_call, destination, priority, creationdate, secondusedreal)
                VALUES (?, ?, ?, ?, ?,?,?)
            `;

            // Execute the query with the provided values
            connection.query(
                insertQuery,
                [didId, userId, destinationType, destination, priority],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error("Error adding DID destination:", insertErr);
                        return res.status(500).json({ error: "Database error" });
                    }

                    res.status(201).json({
                        message: "DID destination added successfully",
                        id: insertResult.insertId,
                    });
                }
            );
        });
    });
};

// Mettre à jour un DID destination
exports.update = (req, res) => {
  const { did, username, destinationType, priority, destination } = req.body;

  // Check for missing fields
  if (!did || !username || destinationType === undefined || priority === undefined || destination === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get user ID from username
  const getUserQuery = "SELECT id FROM pkg_user WHERE username = ?";
  connection.query(getUserQuery, [username], (userErr, userResults) => {
    if (userErr) {
      console.error("Error fetching user ID:", userErr);
      return res.status(500).json({ error: "Database error" });
    }

    if (userResults.length === 0) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const userId = userResults[0].id;

    // Get DID ID from DID
    const getDidQuery = "SELECT id FROM pkg_did WHERE did = ?";
    connection.query(getDidQuery, [did], (didErr, didResults) => {
      if (didErr) {
        console.error("Error fetching DID ID:", didErr);
        return res.status(500).json({ error: "Database error" });
      }

      if (didResults.length === 0) {
        return res.status(400).json({ error: "Invalid DID" });
      }

      const didId = didResults[0].id;

      // Update DID destination
      const updateQuery = `
        UPDATE pkg_did_destination 
        SET voip_call = ?, destination = ?, priority = ?, secondusedreal = 0
        WHERE id_did = ? AND id_user = ?
      `;

      connection.query(
        updateQuery,
        [destinationType, destination, priority, didId, userId],
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating DID destination:", updateErr);
            return res.status(500).json({ error: "Database error" });
          }

          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: "No matching DID destination found" });
          }

          res.json({ 
            message: "DID destination updated successfully",
            affectedRows: updateResult.affectedRows 
          });
        }
      );
    });
  });
};