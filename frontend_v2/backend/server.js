const express = require('express');
const mysql = require('mysql2');
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const app = express();
const port = 5000;
const connection = require("./config/dataBase");
const routeAuth = require("./route/auth");
const routeRestrictNumber = require("./route/client/RestrictNumber.js");
const routeCDR=require("./route/rapport/CDRroute");
const routeSummaryPerDay=require("./route/rapport/SummaryPerDay");
const routeSummaryPerMonth=require("./route/rapport/SummaryPerMonth");
const routeCDRFailed = require("./route/rapport/CDRFailed");
const routeusers = require("./route/client/users");
const routeUserHistory = require("./route/client/UserHistory");
const routeCallerId = require("./route/client/CallerId");
const routeSIPUsers = require("./route/client/SIPUsers");
const routeIax = require("./route/client/Iax");
const routeSummaryPerUser = require("./route/rapport/SummaryPerUser");
const routeSummaryDayUser = require("./route/rapport/SummaryDayUser");
const routeSummaryMonthUser = require("./route/rapport/SummaryMonthUser");  
const routeCallArchive = require("./route/rapport/CallArchive"); 
const routePayMeth = require("./route/billing/PayMeth");
const routeRefills = require("./route/Billing/Refills");
const DIDs = require("./route/DIDs/DIDs");
const routeDIDDestination = require("./route/DIDs/DIDDestination");
const routeDIDUse = require("./route/DIDs/DIDUse");
const routeIVRs = require("./route/DIDs/IVRs");
const routeQueuesMembers = require("./route/DIDs/QueuesMembers");
const routeQueues = require("./route/DIDs/Queues");
const routeProviders = require("./route/routes/Providers");
const routeTrunks = require("./route/routes/trunks");
const routeTrunkGroup = require("./route/routes/trunkGroup");
const routeServers = require("./route/routes/servers");
const routePrefixes = require("./route/rates/prefixes");
const routeProviderrates = require("./route/routes/providerrates");
const routeTrunksErrors = require("./route/routes/trunkserrors");
const routePlans = require("./route/rates/plans");
const routeTariffs = require("./route/rates/tariffs");
const routeUserrate = require("./route/rates/userrate");
const routeOffer = require("./route/rates/offer");
const routeVoucher = require("./route/Billing/Voucher");
const routeRefillProviders = require("./route/Billing/RefillProviders")

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json())
// Simple route to query the database
app.use("/api/auth", routeAuth);
app.use("/api/admin/RestrictNumber", routeRestrictNumber);
app.use("/api/admin/CDR",routeCDR)
app.use("/api/admin/SummaryPerDay",routeSummaryPerDay)
app.use("/api/admin/SummaryPerMonth",routeSummaryPerMonth)
app.use("/api/admin/CdrFailed", routeCDRFailed);
app.use("/api/admin/users", routeusers);
app.use("/api/admin/UserHistory", routeUserHistory)
app.use("/api/admin/CallerId", routeCallerId);
app.use("/api/admin/SIPUsers", routeSIPUsers);
app.use("/api/admin/SummaryPerUser", routeSummaryPerUser);
app.use("/api/admin/CallArchive", routeCallArchive); 
app.use("/api/admin/SummaryMonthUser", routeSummaryMonthUser);
app.use("/api/admin/PayMeth", routePayMeth);
app.use("/api/admin/SummaryDayUser", routeSummaryDayUser);
app.use("/api/admin/Refills", routeRefills); 
app.use("/api/admin/DIDs", DIDs);
app.use("/api/admin/DIDDestination", routeDIDDestination);
app.use("/api/admin/DIDUse", routeDIDUse);
app.use("/api/admin/IVRs", routeIVRs);
app.use("/api/admin/QueuesMembers", routeQueuesMembers);
app.use("/api/admin/Queues", routeQueues);
app.use("/api/admin/Iax", routeIax);
app.use("/api/admin/Providers", routeProviders);
app.use("/api/admin/Trunks", routeTrunks);
app.use("/api/admin/TrunkGroup", routeTrunkGroup);
app.use("/api/admin/Servers", routeServers);
app.use("/api/admin/Prefixes", routePrefixes);
app.use("/api/admin/providerrates", routeProviderrates);
app.use("/api/admin/TrunksErrors", routeTrunksErrors);
app.use("/api/admin/Plans", routePlans);
app.use("/api/admin/Tariffs", routeTariffs);
app.use("/api/admin/Userrate", routeUserrate);
app.use("/api/admin/Offers", routeOffer);
app.use("/api/admin/Voucher", routeVoucher);
app.use("/api/admin/RefillProviders", routeRefillProviders);

// Function to check if a port is in use
const isPortInUse = async (port) => {
  try {
    const server = require('net').createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          return true;
        }
        throw err;
      })
      .once('listening', () => {
        server.close();
        return false;
      })
      .listen(port);
    return false;
  } catch (error) {
    return true;
  }
};

// Try to kill any process using port 5000
const killPortProcess = async (port) => {
  try {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    if (platform === 'win32') {
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (err) {
          console.error(`Error checking port ${port}:`, err);
          return;
        }
        const pids = stdout.match(/LISTENING\s+(\d+)/g);
        if (pids) {
          pids.forEach(pid => {
            const processId = pid.split(' ')[1];
            exec(`taskkill /F /PID ${processId}`, (err) => {
              if (err) {
                console.error(`Error killing process ${processId}:`, err);
              }
            });
          });
        }
      });
    } else {
      exec(`lsof -ti :${port}`, (err, stdout) => {
        if (err) {
          console.error(`Error checking port ${port}:`, err);
          return;
        }
        if (stdout) {
          const pids = stdout.split('\n');
          pids.forEach(pid => {
            if (pid) {
              exec(`kill -9 ${pid}`, (err) => {
                if (err) {
                  console.error(`Error killing process ${pid}:`, err);
                }
              });
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error killing port process:', error);
  }
};

// Create a config directory if it doesn't exist
const configDir = path.join(__dirname, '..', 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Start server with retry logic
const startServer = async () => {
  try {
    // Check if port is in use
    const isPortUsed = await isPortInUse(port);
    if (isPortUsed) {
      console.log(`Port ${port} is in use. Attempting to kill process...`);
      await killPortProcess(port);
    }

    // Start the server
    const server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${port} is still in use. Retrying in 5 seconds...`);
        setTimeout(startServer, 5000);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      server.close(() => {
        console.log('Server closed successfully');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    // Retry after 5 seconds
    setTimeout(startServer, 5000);
  }
};

// Start the server
startServer();