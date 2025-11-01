// src/pages/ModifyProperty.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./modifyProperty.css";

function ModifyProperty() {
  const [token, setToken] = useState("");
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    propertyName: "",
    propertyLocation: "",
    propertyImage: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin");

    const decoded = jwtDecode(token);
    if (decoded.role !== "ADMIN") return navigate("/");

    setToken(token);
    fetchAllProperties(token);
  }, [navigate]);

  const fetchAllProperties = async (token) => {
    try {
      const res = await fetch(
        "http://localhost:3001/api/properties/allproperties",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) setProperties(data);
    } catch (err) {
      console.error("Failed to load properties:", err);
    }
  };

  const handleSelectChange = (e) => {
    const id = e.target.value;
    const selected = properties.find((p) => p._id === id);
    setSelectedId(id);
    if (selected) {
      setForm({
        propertyName: selected.propertyName,
        propertyLocation: selected.propertyLocation,
        propertyImage: null,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, propertyImage: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    const formData = new FormData();
    formData.append("propertyName", form.propertyName);
    formData.append("propertyLocation", form.propertyLocation);
    if (form.propertyImage) {
      formData.append("propertyImage", form.propertyImage);
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/properties/${selectedId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Property updated successfully!");
        fetchAllProperties(token); // Refresh list
        setSelectedId("");
        setForm({
          propertyName: "",
          propertyLocation: "",
          propertyImage: null,
        });
      } else {
        alert(data.message || "Failed to update property.");
      }
    } catch (err) {
      console.error("Error updating property:", err);
    }
  };

  return (
    <div className="modify-property-container">
      <h2>Modify Property</h2>
      <select value={selectedId} onChange={handleSelectChange}>
        <option value="">-- Select a Property --</option>
        {properties.map((p) => (
          <option key={p._id} value={p._id}>
            {p.propertyName} - {p.propertyLocation}
          </option>
        ))}
      </select>

      {selectedId && (
        <form className="modify-property-form" onSubmit={handleSubmit}>
          <label>
            Property Name:
            <input
              type="text"
              name="propertyName"
              value={form.propertyName}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Location:
            <input
              type="text"
              name="propertyLocation"
              value={form.propertyLocation}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Property Image:
            <input
              type="file"
              name="propertyImage"
              onChange={handleFileChange}
            />
          </label>
          <button type="submit">Update Property</button>
        </form>
      )}
    </div>
  );
}

export default ModifyProperty;
