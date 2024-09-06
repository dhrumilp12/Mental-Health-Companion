import { useState, useEffect } from "react";
import apiServerAxios from "../api/axios";
import "../Assets/Styles/MoodLogs.css";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { Box } from "@mui/material";
import { ring2 } from "ldrs";

function MoodLogs() {
    const [moodLogs, setMoodLogs] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    ring2.register();

    useEffect(() => {
        const fetchMoodLogs = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("You are not logged in.");
                return;
            }

            setLoading(true);
            try {
                const response = await apiServerAxios.get(
                    "/user/get_mood_logs",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                console.log("Received data:", response.data); // Check what's being received
                setMoodLogs(response.data.mood_logs || []);
            } catch (error) {
                setError(error.response.data.error);
            } finally {
                setLoading(false);
            }
        };

        fetchMoodLogs();
    }, []);
    const formatDateTime = (dateObject) => {
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        try {
            // Extract the date string from the date object
            const dateString = dateObject["$date"];
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", options);
        } catch (error) {
            console.error("Date parsing error:", error);
            return "Invalid Date";
        }
    };

    if (loading)
        return (
            <Box
                sx={{
                    position: "absolute",
                    left: { xs: "50%", md: "60%" },
                    top: { xs: "50%", md: "40%" },
                    translate: { xs: "-50% -50%", md: "-60% -40%" },
                }}
            >
                <l-ring-2
                    size="50"
                    stroke="5"
                    stroke-length="0.25"
                    bg-opacity="0.1"
                    speed="0.8"
                    color="#656782"
                ></l-ring-2>
            </Box>
        );

    return (
        <div
            className="mood-logs"
            style={{ width: "96%", margin: "40px auto" }}
        >
            <h2>
                <ListAltIcon className="icon-large" />
                Your Mood Journey
            </h2>
            {error ? (
                <div className="error">{error}</div>
            ) : (
                <ul>
                    {moodLogs.map((log, index) => (
                        <li key={index}>
                            <div>
                                <strong>Mood:</strong> {log.mood}
                            </div>
                            <div>
                                <strong>Activities:</strong> {log.activities}
                            </div>
                            <div>
                                <strong>Timestamp:</strong>{" "}
                                {formatDateTime(log.timestamp)}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default MoodLogs;
