"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { customersApi, type Customer } from '@/lib/api';

interface CustomerForm {
    name: string;
    email: string;
    phone: string;
    city: string;
}

const emptyForm: CustomerForm = {
    name: "",
    email: "",
    phone: "",
    city: "",
};

export default function CustomerPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<CustomerForm>(emptyForm);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    const [showDelete, setShowDelete] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [deleting, setDeleting] = useState(false);

    const LIMIT = 10;

    const loadCustomers = useCallback(async (p?: number, s?: string) => {
        setLoading(true);
        setError("");
        try {
            const res = await customersApi.getAll({
                page: p ?? page,
                limit: LIMIT,
                search: s ?? search,
            });
            setCustomers(res.data);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load customers";
            setError(msg);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
        loadCustomers(1, value);
    };

    const goToPage = (p: number) => {
        setPage(p);
        loadCustomers(p);
    };

    const openAddModal = () => {
        setModalMode("add");
        setForm(emptyForm);
        setFormError("");
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (customer: Customer) => {
        setModalMode("edit");
        setForm({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            city: customer.city,
        });
        setFormError("");
        setEditingId(customer.id);
        setShowModal(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!form.name || !form.email || !form.phone || !form.city) {
            setFormError("Please fill in all required fields");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                city: form.city,
            };

            if (modalMode === "edit" && editingId) {
                await customersApi.update(editingId, payload);
            } else {
                await customersApi.create(payload);
            }

            setShowModal(false);
            loadCustomers();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to save customer";
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    const openDeleteConfirm = (customer: Customer) => {
        setDeletingCustomer(customer);
        setShowDelete(true);
    };

    const handleDelete = async () => {
        if (!deletingCustomer) return;
        setDeleting(true);
        try {
            await customersApi.delete(deletingCustomer.id);
            setShowDelete(false);
            setDeletingCustomer(null);
            loadCustomers();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to delete customer";
            setError(msg);
        } finally {
            setDeleting(false);
        }
    };

    const updateField = (field: keyof CustomerForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">Manage your customer base</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div className="search-input-wrap">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button onClick={openAddModal} className="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Customer
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0" }}>
                                        <div className="spinner"></div>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.city}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button onClick={() => openEditModal(customer)} className="btn btn-sm btn-secondary">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 