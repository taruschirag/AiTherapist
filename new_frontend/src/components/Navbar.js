import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setOpen(false);
    };

    const handleNavClick = (to) => {
        navigate(to);
        setOpen(false);
    };

    // Close sidebar when clicking outside
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('navbar-overlay')) {
            setOpen(false);
        }
    };

    return (
        <>
            {/* Hamburger Icon */}
            <div className="navbar-hamburger" onClick={() => setOpen(true)}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>
            {/* Sidebar Overlay */}
            {open && (
                <div className="navbar-overlay" onClick={handleOverlayClick}>
                    <nav className="navbar-sidebar">
                        <div className="navbar-sidebar-header">
                            <span className="navbar-title" onClick={() => handleNavClick('/home')}>AI Therapist</span>
                            <button className="navbar-close" onClick={() => setOpen(false)}>&times;</button>
                        </div>
                        <ul className="navbar-links-vertical">
                            <li>
                                <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => handleNavClick('/home')}>Home</NavLink>
                            </li>
                            <li>
                                <NavLink to="/journal" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => handleNavClick('/journal')}>Journal</NavLink>
                            </li>
                            <li>
                                <NavLink to="/reflect" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => handleNavClick('/reflect')}>Reflect</NavLink>
                            </li>
                            <li>
                                <NavLink to="/summary" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => handleNavClick('/summary')}>Summary</NavLink>
                            </li>
                        </ul>
                        {user && (
                            <button className="navbar-logout-vertical" onClick={handleLogout}>
                                Logout
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </>
    );
};

export default Navbar; 