const connection = require("../../config/dataBase");

// Fetch all Queues with user details, sorted by name or id_user based on request
exports.afficher = (req, res) => {
  const sortBy = req.query.sortBy || 'name'; // Default sort by name
  const query = `
    SELECT 
      q.*,  
      u.id AS user_id,
      u.username AS username
    FROM 
      pkg_queue q
    LEFT JOIN 
      pkg_user u ON q.id_user = u.id
    ORDER BY 
      ${sortBy} ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des queues:", err.message);
      return res.status(500).json({ error: "Erreur de base de données", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Aucune queue trouvée" });
    }

    res.json({ queues: results });
  });
};

// Add a new Queue
exports.ajouter = (req, res) => {
    const { 
        name, id_user, language, strategy, ringinuse
    } = req.body;

    // Ensure required fields are provided
    if (!name || !id_user || !language) {
        return res.status(400).json({ error: "Name, User ID, and Language are required" });
    }

    // Default values for optional fields
    const query = `
        INSERT INTO pkg_queue 
          (name, id_user, language, strategy, ringinuse)
        VALUES 
          (?, ?, ?, ?, ?)
    `;

    // Parameters for the query
    const params = [
        name, 
        id_user, 
        language, 
        strategy || 'Ringall', 
        ringinuse || 0
    ];

    // Execute the query
    connection.query(query, params, (error, results) => {
        if (error) {
            console.log("Error inserting queue:", error);
            return res.status(500).json({ error: "Database error", details: error.message });
        }

        res.status(201).json({ 
            message: "Queue added successfully", 
            queue: { 
                id: results.insertId, 
                name, 
                id_user,
                language,
                strategy: strategy || 'Ringall'
            } 
        });
    });
};

// Update a Queue
exports.modifier = (req, res) => {
  const queueId = req.params.id;
  console.log('Updating queue with ID:', queueId);
  console.log('Request body:', req.body);
  
  // Extract fields with default values to prevent NULL values
  const { 
    id_user, 
    name,  // Ajout du champ name
    language = 'En', 
    strategy = 'Ringall', 
    talk_time = 0, 
    total_calls = 0, 
    answered = 0 
  } = req.body;

  // Validate that required fields are present
  if (!id_user) {
    return res.status(400).json({ error: "User ID is required" });
  }
  
  // Log the name field to debug
  console.log('Name field value:', name);

  console.log('Processed update data:', { id_user, language, strategy, talk_time, total_calls, answered });

  const query = `
    UPDATE pkg_queue 
    SET id_user = ?, name = ?, language = ?, strategy = ?, var_talktime = ?, var_totalcalls = ?, var_answeredCalls = ? 
    WHERE id = ?
  `;

  // Ensure all values are properly converted to their expected types
  const params = [
    id_user,
    name,  // Ajout du champ name
    language,
    strategy,
    talk_time || 0,  // Ensure these are never NULL
    total_calls || 0,
    answered || 0,
    queueId
  ];

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error("Erreur lors de la mise à jour de la queue:", error);
      return res.status(500).json({ error: "Erreur de base de données", details: error.message });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Queue non trouvée" });
    }

    res.status(200).json({ message: "Queue mise à jour avec succès" });
  });
};

// Delete a Queue
exports.del = (req, res) => {
  const queueId = req.params.id;

  const query = "DELETE FROM pkg_queue WHERE id = ?";

  connection.query(query, [queueId], (err, result) => {
    if (err) {
      console.error("Erreur lors de la suppression de la queue:", err);
      return res.status(500).json({ error: "Erreur de base de données", details: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Queue non trouvée" });
    }

    res.status(200).json({ message: "Queue supprimée avec succès" });
  });
};