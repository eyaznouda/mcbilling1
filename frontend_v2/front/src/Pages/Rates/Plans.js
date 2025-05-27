import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Table, Form, Modal, Alert, Card, Container, Row, Col, Badge, Spinner } from "react-bootstrap";
import { CSVLink } from "react-csv";
import ReactPaginate from "react-paginate";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSearch,
  FaDownload,
  FaPlusCircle,
  FaTrashAlt,
  FaFileAlt,
  FaCog
} from "react-icons/fa";

// Constants
const ITEMS_PER_PAGE = 10;

const DEFAULT_MODAL_DATA = {
  name: "",
  techprefix: "",
  selectedPlan: "",
  useOnSignup: "No",
  noticesWithAudio: "No",
  services: [],
};

// Header Component
function PlansHeader({ onAddClick, plans, isExporting = false }) {
  const csvData = [
    ["Nom", "Tech Prefix", "Date de création", "Utiliser lors de l'inscription", "Alertes audio", "Services"],
    ...plans.map(plan => [
      plan.name,
      plan.techprefix,
      new Date(plan.creationdate).toLocaleDateString(),
      plan.useOnSignup || "No",
      plan.noticesWithAudio || "No",
      (plan.services || []).join(", ")
    ])
  ];

  return (
    <Card.Header className="d-flex flex-wrap align-items-center p-0 rounded-top overflow-hidden">
      <div className="bg-primary p-3 w-100 position-relative">
        <div className="position-absolute top-0 end-0 p-2 d-none d-md-block">
          {Array(5)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="floating-icon position-absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <FaFileAlt
                  className="text-white opacity-25"
                  style={{
                    fontSize: `${Math.random() * 1.5 + 0.5}rem`,
                  }}
                />
              </div>
            ))}
        </div>
        <div className="d-flex align-items-center position-relative z-2">
          <div className="bg-white rounded-circle p-3 me-3 shadow pulse-effect">
            <FaFileAlt className="text-primary fs-3" />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-white">Liste des Plans</h2>
            <p className="text-white-50 mb-0 d-none d-md-block">Gérez vos plans facilement</p>
          </div>
        </div>
      </div>
      <div className="w-100 bg-white p-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <Badge bg="primary" className="d-flex align-items-center p-2 ps-3 rounded-pill">
            <span className="me-2 fw-normal">
              Total: <span className="fw-bold">{plans.length}</span>
            </span>
            <span
              className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "24px", height: "24px" }}
            >
              <FaFileAlt size={12} />
            </span>
          </Badge>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={onAddClick}
            className="d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
          >
            <div className="icon-container">
              <FaPlusCircle />
            </div>
            <span>Ajouter</span>
          </Button>
          <CSVLink
            data={csvData}
            filename={"plans_export.csv"}
            className="btn btn-success d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
            disabled={isExporting}
          >
            <div className="icon-container">
              {isExporting ? <Spinner animation="border" size="sm" /> : <FaDownload />}
            </div>
            <span>{isExporting ? "Exportation..." : "Exporter CSV"}</span>
          </CSVLink>
        </div>
      </div>
    </Card.Header>
  );
}

// Search Bar Component
function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="search-container position-relative">
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <FaSearch className="text-muted" />
        </span>
        <Form.Control
          type="text"
          placeholder="Recherche par nom"
          value={searchTerm}
          onChange={onSearchChange}
          className="border-start-0 shadow-none ps-0"
        />
      </div>
    </div>
  );
}

// Action Buttons Component
function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="d-flex gap-2">
      <Button
        size="sm"
        variant="light"
        className="d-flex align-items-center justify-content-center p-2 rounded-circle action-btn"
        onClick={onEdit}
        title="Modifier"
      >
        <FaEdit className="btn-icon text-primary" />
      </Button>
      <Button
        size="sm"
        variant="light"
        className="d-flex align-items-center justify-content-center p-2 rounded-circle action-btn"
        onClick={onDelete}
        title="Supprimer"
      >
        <FaTrashAlt className="btn-icon text-danger" />
      </Button>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-5">
      <div className="mb-3">
        <FaFileAlt size={48} className="text-muted" />
      </div>
      <h5>Aucun plan trouvé</h5>
      <p className="text-muted">Aucun plan ne correspond à votre recherche</p>
    </div>
  );
}

// Plans Table Component
function PlansTableComponent({ plans, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Chargement des plans...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="table-responsive">
      <Table hover className="align-middle mb-0 bg-white">
        <thead className="bg-light">
          <tr>
            <th className="fw-semibold">Nom</th>
            <th className="fw-semibold">Tech Prefix</th>
            <th className="fw-semibold">Date de création</th>
            <th className="fw-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="plan-row">
              <td>
                <div className="d-flex align-items-center">
                  <div className="ms-0">
                    <p className="fw-bold mb-1">{plan.name}</p>
                  </div>
                </div>
              </td>
              <td>{plan.techprefix}</td>
              <td>{new Date(plan.creationdate).toLocaleDateString()}</td>
              <td className="text-center">
                <ActionButtons
                  onEdit={() => onEdit(plan)}
                  onDelete={() => onDelete(plan.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

// Pagination Component
function PaginationSection({ pageCount, onPageChange, currentPage }) {
  if (pageCount <= 1) return null;

  return (
    <ReactPaginate
      previousLabel={"«"}
      nextLabel={"»"}
      breakLabel={"..."}
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={3}
      onPageChange={onPageChange}
      containerClassName={"pagination pagination-sm justify-content-center mb-0"}
      pageClassName={"page-item"}
      pageLinkClassName={"page-link"}
      previousClassName={"page-item"}
      previousLinkClassName={"page-link"}
      nextClassName={"page-item"}
      nextLinkClassName={"page-link"}
      breakClassName={"page-item"}
      breakLinkClassName={"page-link"}
      activeClassName={"active"}
      forcePage={currentPage}
    />
  );
}

// Plan Modal Component
function PlanModal({
  show,
  onHide,
  title,
  onSubmit,
  modalData,
  availablePlans,
  onInputChange,
  isSubmitting,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Nom</Form.Label>
            <Form.Control
              type="text"
              value={modalData.name}
              onChange={(e) => onInputChange({ ...modalData, name: e.target.value })}
              className="shadow-none"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Utiliser lors de l'inscription</Form.Label>
            <Form.Select
              value={modalData.useOnSignup}
              onChange={(e) => onInputChange({ ...modalData, useOnSignup: e.target.value })}
              className="shadow-none"
            >
              <option value="No">Non</option>
              <option value="Yes">Oui</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Alertes audio</Form.Label>
            <Form.Select
              value={modalData.noticesWithAudio}
              onChange={(e) => onInputChange({ ...modalData, noticesWithAudio: e.target.value })}
              className="shadow-none"
            >
              <option value="Yes">Oui</option>
              <option value="No">Non</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tech Prefix</Form.Label>
            <Form.Control
              type="text"
              value={modalData.techprefix}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/[^0-9]/g, '');
                onInputChange({ ...modalData, techprefix: value });
              }}
              className="shadow-none"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Sélectionnez un ou plusieurs services</Form.Label>
            <Form.Select
              multiple
              value={modalData.services}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (option) => option.value);
                onInputChange({ ...modalData, services: options });
              }}
              className="shadow-none"
            >
              <option value="voice">Voice</option>
              <option value="sms">SMS</option>
              <option value="data">Data</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="d-flex align-items-center gap-2"
          >
            {isSubmitting && <Spinner animation="border" size="sm" />}
            {modalData.id ? "Modifier" : "Ajouter"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

const PlansTable = () => {
  // State
  const [plans, setPlans] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(DEFAULT_MODAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchAvailablePlans();
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/admin/Plans/afficher");
      setPlans(res.data.plans);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setError("Erreur lors du chargement des plans. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/Plans/afficher");
      setAvailablePlans(res.data.plans);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setError("Erreur lors du chargement des plans disponibles.");
    }
  };

  // Handlers
  const handleAdd = () => {
    setModalData(DEFAULT_MODAL_DATA);
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setModalData({
      name: plan.name,
      techprefix: plan.techprefix,
      selectedPlan: plan.id,
      useOnSignup: plan.useOnSignup || "No",
      noticesWithAudio: plan.noticesWithAudio || "No",
      services: plan.services || [],
      id: plan.id,
    });
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    if (!modalData.name && !modalData.selectedPlan) {
      setError("Veuillez sélectionner un plan ou saisir un nom.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalData.id) {
        await axios.put(`http://localhost:5000/api/admin/Plans/modifier/${modalData.id}`, modalData);
        setSuccessMessage("Plan modifié avec succès!");
        // Show alert after modification
        alert("Plan modifié avec succès!");
      } else {
        await axios.post("http://localhost:5000/api/admin/Plans/ajouter", modalData);
        setSuccessMessage("Plan ajouté avec succès!");
        // Show alert after addition
        alert("Plan ajouté avec succès!");
      }
      setShowModal(false);
      fetchPlans();
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      setError("Erreur lors de l'enregistrement du plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setError("");
    setSuccessMessage("");
    
    try {
      // Send the delete request with the ID in the URL
      try {
        await axios.delete(`http://localhost:5000/api/admin/Plans/supprimer/${deleteId}`);
        setSuccessMessage("Plan supprimé avec succès!");
        fetchPlans();
      } catch (error) {
        if (error.response && error.response.data) {
          const { error: errorMessage, details } = error.response.data;
          if (details && details.includes('foreign key')) {
            setError("Ce plan ne peut pas être supprimé car il est utilisé dans d'autres enregistrements.");
          } else {
            setError(errorMessage || "Erreur lors de la suppression du plan.");
          }
        } else {
          setError("Erreur lors de la suppression du plan.");
        }
        throw error; // Re-throw the error to be caught by the outer catch block
      }
    } catch (error) {
      console.error("Erreur de suppression:", error);
      setError("Erreur lors de la suppression du plan.");
      // Log the response data if available
      if (error.response && error.response.data) {
        console.error("Server error details:", error.response.data);
      }
    } finally {
      setDeleteModal(false);
      setDeleteId(null);
    }
  };

  // Filter and paginate plans
  const filteredPlans = plans.filter((plan) =>
    (plan?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const pageCount = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const pagedPlans = filteredPlans.slice(offset, offset + ITEMS_PER_PAGE);

  // Add custom CSS for animations and styling
  const customStyles = `
    .floating-icon {
      position: absolute;
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .pulse-effect {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(13, 110, 253, 0); }
      100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
    }
    .btn-hover-effect .icon-container {
      transition: all 0.3s ease;
    }
    .btn-hover-effect:hover .icon-container {
      transform: translateY(-2px);
    }
    .action-btn .btn-icon {
      transition: transform 0.2s ease;
    }
    .action-btn:hover .btn-icon {
      transform: scale(1.2);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .plan-row {
      transition: all 0.2s ease;
    }
    .plan-row:hover {
      background-color: rgba(13, 110, 253, 0.05);
    }
    .main-card {
      border-radius: 0.5rem;
      overflow: hidden;
    }
  `;

  const handleInputChange = (data) => {
    setModalData(data);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div>
      <style>{customStyles}</style>
      <div className="dashboard-main">
        <Container fluid className="px-4 py-4">
          <Row className="justify-content-center">
            <Col xs={12} lg={11}>
              <Card className="shadow border-0 overflow-hidden main-card">
                <PlansHeader
                  onAddClick={handleAdd}
                  plans={plans}
                  isExporting={isExporting}
                />
                <Card.Body className="p-4" style={{ animation: "fadeIn 0.5s ease-in-out" }}>
                  {error && (
                    <Alert variant="danger" className="d-flex align-items-center mb-4 shadow-sm">
                      <FaTimesCircle className="me-2" />
                      {error}
                    </Alert>
                  )}
                  {successMessage && (
                    <Alert variant="success" className="d-flex align-items-center mb-4 shadow-sm">
                      <FaCheckCircle className="me-2" />
                      {successMessage}
                    </Alert>
                  )}

                  <Row className="mb-4">
                    <Col md={6} lg={4}>
                      <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Col>
                  </Row>

                  {filteredPlans.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <>
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
                        <div className="text-muted small">
                          {!isLoading && (
                            <>
                              <Badge bg="light" text="dark" className="me-2 shadow-sm">
                                <span className="fw-semibold">{pagedPlans.length}</span> sur {filteredPlans.length} plans
                              </Badge>
                              {searchTerm && (
                                <Badge bg="light" text="dark" className="shadow-sm">
                                  Filtrés de {plans.length} total
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                        <PaginationSection
                          pageCount={pageCount}
                          onPageChange={handlePageChange}
                          currentPage={currentPage}
                        />
                      </div>
                      <PlansTableComponent
                        plans={pagedPlans}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isLoading={isLoading}
                      />
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
      <PlanModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={modalData.id ? "Modifier Plan" : "Ajouter Plan"}
        onSubmit={handleModalSubmit}
        modalData={modalData}
        availablePlans={availablePlans}
        onInputChange={handleInputChange}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PlansTable;