import { Navigate } from 'react-router-dom';

function AppDashboard({ user }) {
    if(!user) {
        return (
            <Navigate to="/login" replace />
        )
    }
    
    return (
        <div>
            <h1>Dashboard View</h1>
            <p>Lorem Ipsum il dolor</p>
        </div>
    )
}

export default AppDashboard;