import { Link } from "react-router-dom";

function NavBar({ user, logOut }) {
    return (
        <nav>
            <Link to="/" style={{ padding: 5}}>Home</Link>
            <Link to="/about" style={{ padding: 5}}>About</Link>
            { user && <Link to="/dashboard" style={{ padding: 5}}>Dashboard</Link>}
            { !user && <Link to="/login" style={{ padding: 5}}>Login</Link>}
            { user && <Link><span onClick={logOut}>Logout</span></Link>}
        </nav>
    )
}

export default NavBar;