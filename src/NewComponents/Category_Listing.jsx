import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import "../Component/BrandSelector.css";
import Swal from 'sweetalert2';

function Category_Listing() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryCode, setSelectedCategoryCode] = useState(null);
    const [categoryListings, setCategoryListings] = useState([]);
    const [showFormModal, setShowFormModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", id: null });
    const [searchTerm, setSearchTerm] = useState("");

    // ✅ Fetch categories including 'code'
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("category")
                .select("id, name, code")
                .order("name", { ascending: true });

            if (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            } else {
                setCategories(data);
            }
        };

        fetchCategories();
    }, []);

    // ✅ Fetch listings by category_code
    const fetchListings = async (categoryCode) => {
        const { data, error } = await supabase
            .from("category_listing")
            .select("id, name, description")
            .eq("category_code", categoryCode);

        if (error) {
            console.error("Error fetching category listings:", error);
            setCategoryListings([]);
        } else {
            setCategoryListings(data.map(item => ({
                id: item.id.toString(),
                name: item.name,
                description: item.description || "",
            })));
        }
    };

    // ✅ Handle category selection
    const handleClick = async (category) => {
        setSelectedCategory(category.name);
        setSelectedCategoryCode(category.code);
        setShowFormModal(false);
        await fetchListings(category.code);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ✅ Save listing using category_code
    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            return Swal.fire({
                icon: "warning",
                title: "Validation Error",
                text: "Name is required",
            });
        }

        if (!selectedCategoryCode) {
            return Swal.fire({
                icon: "warning",
                title: "No Category Selected",
                text: "Please select a category first.",
            });
        }

        try {
            if (formData.id) {
                // Update
                const { error } = await supabase
                    .from("category_listing")
                    .update({
                        name: formData.name,
                        description: formData.description || null,
                    })
                    .eq("id", formData.id);

                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("category_listing")
                    .insert({
                        name: formData.name,
                        description: formData.description || null,
                        category_code: selectedCategoryCode,
                        parentname: selectedCategory,
                    });

                if (error) throw error;
            }

            Swal.fire({
                icon: "success",
                title: "Saved!",
                showConfirmButton: false,
                timer: 1500,
            });

            setShowFormModal(false);
            setFormData({ id: null, name: "", description: "" });
            await fetchListings(selectedCategoryCode);
        } catch (error) {
            console.error("Save failed:", error);
            Swal.fire({
                icon: "error",
                title: "Save Failed",
                text: error.message || "Unknown error",
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to undo this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from("category_listing")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setCategoryListings(prev => prev.filter(item => item.id !== id));

            Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "The listing has been deleted.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Delete failed:", error);
            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text: error.message || "An unexpected error occurred.",
            });
        }
    };

    const openFormModal = (existing = null) => {
        setFormData(existing || { name: "", description: "", id: null });
        setShowFormModal(true);
    };

    const closeModal = () => {
        setSelectedCategory(null);
        setSelectedCategoryCode(null);
        setShowFormModal(false);
        setCategoryListings([]);
    };

    const filteredListings = categoryListings.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="brand-selector-wrapper">
            <div className="brand-grid-container">
                <h1 className="brand-header">Category Listings</h1>
                <div className="brand-grid">
                    {categories.length === 0 ? (
                        <p>No categories found</p>
                    ) : (
                        categories.map(({ id, name, code }) => (
                            <button
                                key={id}
                                className={`brand-card ${selectedCategory === name ? "selected" : ""}`}
                                onClick={() => handleClick({ id, name, code })}
                            >
                                {name}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {selectedCategory ? (
                <div className="brand-modal rotate-in">
                    <button className="close-btn" onClick={closeModal}>&times;</button>
                    <h2>Listings under: {selectedCategory}</h2>

                    <button className="btn-add-new" onClick={() => openFormModal()}>
                        Add Listing
                    </button>

                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                        style={{
                            padding: "10px",
                            marginBottom: "15px",
                            width: "100%",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "16px"
                        }}
                    />

                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Description</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredListings.length === 0 ? (
                                    <tr>
                                        <td style={noDataStyle} colSpan={3}>
                                            No listings match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredListings.map((item) => (
                                        <tr key={item.id} style={{}}>
                                            <td style={tdStyle}>{item.name}</td>
                                            <td style={tdStyle}>{item.description}</td>
                                            <td style={tdStyle}>
                                                <button
                                                    onClick={() => openFormModal(item)}
                                                    aria-label={`Edit ${item.name}`}
                                                    title="Edit"
                                                    style={editButtonStyle}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(255,165,0,0.5)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "scale(1)";
                                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(255,165,0,0.3)";
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = "scale(0.95)";
                                                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(255,140,0,0.6)";
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(255,165,0,0.5)";
                                                    }}
                                                >
                                                    <FaEdit style={{ fontSize: 20 }} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    aria-label={`Delete ${item.name}`}
                                                    title="Delete"
                                                    style={deleteButtonStyle}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(211,47,47,0.5)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "scale(1)";
                                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(211,47,47,0.3)";
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.currentTarget.style.transform = "scale(0.95)";
                                                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(139,0,0,0.6)";
                                                    }}
                                                    onMouseUp={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.boxShadow = "0 6px 12px rgba(211,47,47,0.5)";
                                                    }}
                                                >
                                                    <FaTrash style={{ fontSize: 20 }} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            ) : (
                <div className="activities-modal no-selection">
                    <h2>No category selected</h2>
                    <p>Please select a category to view listings.</p>
                </div>
            )}

            {showFormModal && (
                <div className="form-modal-overlay">
                    <div className="form-modal-content">
                        <h3>{formData.id ? "Edit Listing" : "Add Listing"}</h3>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>PACKING</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="btn-save">Save</button>
                                <button type="button" className="btn-cancel" onClick={() => setShowFormModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
const tableWrapperStyle = {
  overflowX: "auto",
  marginTop: 20,
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
  padding: 20,
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0 10px",
};

const thStyle = {
  padding: "12px 20px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: 16,
  color: "#ffffffff",
  borderBottom: "2px solid #ddd",
  backgroundColor: "#0087c5ff",
};

const tdStyle = {
  padding: "15px 20px",
  fontSize: 15,
  color: "#333",
  backgroundColor: "#fafafa",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const noDataStyle = {
  textAlign: "center",
  padding: 30,
  fontSize: 16,
  color: "#999",
  fontStyle: "italic",
};

const buttonBaseStyle = {
  border: "none",
  background: "none",
  cursor: "pointer",
  padding: 10,
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: 10,
  transition: "transform 0.25s ease, box-shadow 0.25s ease",
  outline: "none",
};

const editButtonStyle = {
  ...buttonBaseStyle,
  color: "orange",
  boxShadow: "0 4px 6px rgba(255,165,0,0.3)",
};

const deleteButtonStyle = {
  ...buttonBaseStyle,
  color: "#d32f2f",
  boxShadow: "0 4px 6px rgba(211,47,47,0.3)",
};

export default Category_Listing;
