import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ActivityDash from './ActivityDash';
import { Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Chart, registerables } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getApiEndpoint } from '../../utils/apiConfig';

// Register Chart.js components
Chart.register(...registerables);

// Dashboard component that provides an overview of the system
const Dashboard = () => {
  // State for call statistics
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    callDuration: 0 // in minutes
  });
  const [cdrFailedData, setCdrFailedData] = useState([]);

  // State for recent activity
  const [recentActivity, setRecentActivity] = useState([]);
  
  // State for loading indicators
  const [loading, setLoading] = useState({
    callStats: true,
    callTrends: true,
    recentActivity: true
  });
  
  // State for error messages
  const [error, setError] = useState({
    callStats: null,
    callTrends: null,
    recentActivity: null
  });
  
  // State for call trends data
  const [callTrendsData, setCallTrendsData] = useState({
    labels: [],
    datasets: []
  });
   const fetchCdrFailedData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/CdrFailed/affiche"
        );
        const data = response.data.cdr_failed;
        setCdrFailedData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Unable to retrieve data.");
      } finally {
        setLoading(false);
      }
    };
  
  // Fetch call statistics from the SummaryPerDay API
  useEffect(() => {
    fetchCdrFailedData()
  }, []);
  console.log(cdrFailedData);
  
  // Fetch call trends data from the SummaryPerDay API
  useEffect(() => {
    const fetchCallTrends = async () => {
      try {
        setLoading(prev => ({ ...prev, callTrends: true }));
        
        // Fetch call summary data
        const response = await axios.get("http://localhost:5000/api/admin/SummaryPerDay");
        
        if (response.data && response.data.data) {
          const summaryData = response.data.data;
          
          // Sort data by day
          summaryData.sort((a, b) => new Date(a.Day) - new Date(b.Day));
          
          // Take the last 6 days or all days if less than 6
          const recentData = summaryData.slice(-6);
          
          // Extract labels (days) and call volumes
          const labels = recentData.map(day => {
            const date = new Date(day.Day);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          });
          
          const callVolumes = recentData.map(day => day.Nb_Call || 0);
          const failedVolumes = recentData.map(day => day.Nb_Call_Fail || 0);
          const successVolumes = recentData.map(day => (day.Nb_Call || 0) - (day.Nb_Call_Fail || 0));
          
          setCallTrendsData({
            labels,
            datasets: [
              {
                label: 'Total Calls',
                data: callVolumes,
                fill: false,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.1
              },
              {
                label: 'Successful Calls',
                data: successVolumes,
                fill: false,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.1
              },
              {
                label: 'Failed Calls',
                data: failedVolumes,
                fill: false,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.1
              }
            ]
          });
        }
        
        setLoading(prev => ({ ...prev, callTrends: false }));
      } catch (err) {
        console.error("Error fetching call trends:", err);
        setError(prev => ({ ...prev, callTrends: "Failed to load call trends" }));
        setLoading(prev => ({ ...prev, callTrends: false }));
      }
    };
    
    fetchCallTrends();
  }, []);
  
  // Fetch recent activity from CDR and user history
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(prev => ({ ...prev, recentActivity: true }));
        
        // Fetch recent calls from CDR
        const cdrResponse = await axios.get("http://localhost:5000/api/admin/CDR/affiche");
        
        // Fetch user history
        const userHistoryResponse = await axios.get("http://localhost:5000/api/admin/UserHistory/affiche");
        
        const activities = [];
        
        // Process CDR data
        if (cdrResponse.data && Array.isArray(cdrResponse.data)) {
          const recentCalls = cdrResponse.data.slice(0, 5).map(call => ({
            id: `call-${call.id || Math.random().toString(36).substr(2, 9)}`,
            type: 'call',
            user: call.src || 'Unknown',
            timestamp: new Date(call.calldate || Date.now()).toLocaleString(),
            status: call.disposition === 'ANSWERED' ? 'success' : 'danger',
            details: `${call.disposition === 'ANSWERED' ? 'Successful' : 'Failed'} call to ${call.dst || 'Unknown'}`
          }));
          
          activities.push(...recentCalls);
        }
        
        // Process user history data
        if (userHistoryResponse.data && Array.isArray(userHistoryResponse.data)) {
          const userActivities = userHistoryResponse.data.slice(0, 5).map(activity => ({
            id: `activity-${activity.id || Math.random().toString(36).substr(2, 9)}`,
            type: 'user',
            user: activity.username || 'Unknown',
            timestamp: new Date(activity.date || Date.now()).toLocaleString(),
            status: 'info',
            details: activity.description || 'User activity'
          }));
          
          activities.push(...userActivities);
        }
        
        // Sort activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Take the 10 most recent activities
        setRecentActivity(activities.slice(0, 10));
        
        setLoading(prev => ({ ...prev, recentActivity: false }));
      } catch (err) {
        console.error("Error fetching recent activity:", err);
        setError(prev => ({ ...prev, recentActivity: "Failed to load recent activity" }));
        setLoading(prev => ({ ...prev, recentActivity: false }));
      }
    };
    
    fetchRecentActivity();
  }, []);

  // Chart data for call distribution
  const callDistributionData = {
    labels: ['Successful Calls', 'Failed Calls'],
    datasets: [
      {
        data: [callStats.successfulCalls, callStats.failedCalls],
        backgroundColor: ['#28a745', '#dc3545'],
        hoverBackgroundColor: ['#218838', '#c82333'],
        borderWidth: 1
      }
    ]
  };

  // Options for the doughnut chart
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    cutout: '70%'
  };

  // Options for the line chart
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Function to format minutes into hours and minutes
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const badgeClass = {
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      danger: 'bg-danger'
    }[status] || 'bg-secondary';

    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  return (
    <div className="dashboard-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div>
          <button className="btn btn-sm btn-outline-primary me-2">
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-gear me-1"></i> Settings
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              {loading.callStats ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error.callStats ? (
                <div className="text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error.callStats}
                </div>
              ) : (
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-muted">Total Calls</h6>
                    <h3>{callStats.totalCalls.toLocaleString()}</h3>
                  </div>
                  <div className="text-primary fs-1">
                    <i className="bi bi-telephone"></i>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              {loading.callStats ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : error.callStats ? (
                <div className="text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error.callStats}
                </div>
              ) : (
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-muted">Success Rate</h6>
                    <h3>{callStats.totalCalls > 0 ? Math.round((callStats.successfulCalls / callStats.totalCalls) * 100) : 0}%</h3>
                  </div>
                  <div className="text-success fs-1">
                    <i className="bi bi-graph-up"></i>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              {loading.callStats ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="danger" />
                </div>
              ) : error.callStats ? (
                <div className="text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error.callStats}
                </div>
              ) : (
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-muted">Failed Calls</h6>
                    <h3>{cdrFailedData.length}</h3>
                  </div>
                  <div className="text-danger fs-1">
                    <i className="bi bi-telephone-x"></i>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              {loading.callStats ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="warning" />
                </div>
              ) : error.callStats ? (
                <div className="text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error.callStats}
                </div>
              ) : (
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 className="text-muted">Total Duration</h6>
                    <h3>{formatDuration(callStats.callDuration)}</h3>
                  </div>
                  <div className="text-warning fs-1">
                    <i className="bi bi-clock"></i>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Call Distribution</h5>
            </Card.Header>
            <Card.Body>
              {loading.callStats ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error.callStats ? (
                <div className="text-danger d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                  <div>
                    <i className="bi bi-exclamation-triangle-fill fs-1 d-block text-center mb-3"></i>
                    <p>{error.callStats}</p>
                  </div>
                </div>
              ) : (
                <div style={{ height: '250px' }}>
                  <Doughnut data={callDistributionData} options={doughnutOptions} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Call Trends</h5>
            </Card.Header>
            <Card.Body>
              {loading.callTrends ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error.callTrends ? (
                <div className="text-danger d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                  <div>
                    <i className="bi bi-exclamation-triangle-fill fs-1 d-block text-center mb-3"></i>
                    <p>{error.callTrends}</p>
                  </div>
                </div>
              ) : (
                <div style={{ height: '250px' }}>
                  <Line data={callTrendsData} options={lineOptions} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {loading.recentActivity ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : error.recentActivity ? (
                <Alert variant="danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error.recentActivity}
                </Alert>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                  <p>No recent activities found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>User</th>
                        <th>Details</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map(activity => (
                        <tr key={activity.id}>
                          <td>
                            <i className={`bi bi-${activity.type === 'call' ? 'telephone' : activity.type === 'user' ? 'person' : 'gear'} me-2`}></i>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </td>
                          <td>{activity.user}</td>
                          <td>{activity.details}</td>
                          <td><StatusBadge status={activity.status} /></td>
                          <td>{activity.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Notifications */}
      <Row>
        <Col md={12}>
          <Alert variant="info" className="d-flex align-items-center">
            <i className="bi bi-info-circle-fill me-2 fs-4"></i>
            <div>
              <strong>System Notification:</strong> The next scheduled maintenance will be on May 15, 2025 at 02:00 AM.
            </div>
          </Alert>
        </Col>
      </Row>


    </div>
  );
};

export default Dashboard;
