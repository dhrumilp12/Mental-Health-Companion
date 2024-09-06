import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiServerAxios from "../api/axios";
import {
    Button,
    Container,
    Typography,
    CssBaseline,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tabs,
    Tab,
    Box,
    InputBase,
} from "@mui/material";
import {
    createTheme,
    ThemeProvider,
    styled,
    alpha,
} from "@mui/material/styles";
import WcIcon from "@mui/icons-material/Wc";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";

import PasswordUpdateTab from "./passwordUpdateTab";
import DialogBox from "./reusables/DialogBox";

const CustomTabs = styled(Tabs)({
    background: "#fff", // Set the background color you prefer
    borderRadius: "8px", // Optional: rounded corners
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Optional: adds a subtle shadow for depth
    margin: "20px 0", // Adds margin around the tabs for spacing
    maxWidth: "100%", // Ensures it doesn't overflow its container
    overflow: "hidden", // Prevents any internal content from overflowing
});

const CustomTab = styled(Tab)({
    fontSize: "1rem", // Sets the font size to 16px
    fontWeight: "bold", // Makes the font weight bold
    color: "#3F51B5", // Uses the primary color defined in the theme
    marginRight: "4px", // Adds space between tabs
    marginLeft: "4px", // Adds space between tabs
    flex: 1, // Each tab flexes to fill available space
    maxWidth: "none", // Allows the tab to grow as needed
    "&.Mui-selected": {
        // Styles for the selected tab
        color: "#F6AE2D", // Changes text color when selected
        background: "#e0e0e0", // Light grey background on selection
    },
    "&:hover": {
        // Styles for hover state
        background: "#f4f4f4", // Lighter grey background on hover
        transition: "background-color 0.3s", // Smooth transition for background color
    },
    "@media (max-width: 720px)": {
        // Responsive adjustment for smaller screens
        padding: "6px 12px", // Reduces padding on smaller screens
        fontSize: "0.8rem", // Reduces font size to fit on smaller devices
    },
});

const theme = createTheme({
    palette: {
        primary: {
            main: "#656782", // Changed to a deep blue shade
        },
        secondary: {
            main: "#F6AE2D", // Changed to a golden yellow for highlights
        },
        background: {
            default: "#ecf0f5", // Light grey background
        },
        text: {
            main: "#000", // light black
        },
    },
    typography: {
        fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif', // Changed to Arial for a more neutral look
        button: {
            textTransform: "none",
            fontWeight: "bold",
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    borderRadius: 8, // Slightly rounded corners
                    "&:hover": {
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    padding: "20px",
                    borderRadius: "10px", // More pronounced rounded corners
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)", // Subtle shadow for depth
                },
            },
        },
    },
});

const BootstrapInput = styled(InputBase)(({ theme }) => ({
    "label + &": {
        marginTop: theme.spacing(3),
    },
    "& .MuiInputBase-input": {
        borderRadius: 20,
        position: "relative",
        backgroundColor: "#fff",
        border: "2px solid",
        borderColor: "#E0E3E7",
        fontSize: 16,
        width: 577,
        padding: "10px 12px",
        transition: theme.transitions.create([
            "border-color",
            "background-color",
            "box-shadow",
        ]),
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(","),
        "&:focus": {
            boxShadow: `${alpha(
                theme.palette.primary.main,
                0.25
            )} 0 0 0 0.2rem`,
            borderColor: theme.palette.primary.main,
        },
        ...theme.applyStyles("dark", {
            backgroundColor: "#1A2027",
            borderColor: "#2D3843",
        }),
    },
}));

function UserProfile() {
    const { userId } = useParams();
    const token = localStorage.getItem("token");
    const [user, setUser] = useState({
        username: "",
        name: "",
        email: "",
        age: "",
        gender: "",
        placeOfResidence: "",
        fieldOfWork: "",
        mental_health_concerns: [],
    });
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    const [message, setMessage] = useState("");
    const [open, setOpen] = useState(false);
    const [severity, setSeverity] = useState("info");
    const [isDeleteRequested, setIsDeleteRequested] = useState(false);
    const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);
    const [usernameCheck, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userId) {
            console.error("User ID is undefined");
            return;
        }
        const fetchData = async () => {
            try {
                const response = await apiServerAxios.get(
                    `/user/profile/${userId}`
                );
                const formattedData = {
                    username: response.data.username || "",
                    name: response.data.name || "",
                    email: response.data.email || "",
                    age: response.data.age || "",
                    gender: response.data.gender || "",
                    placeOfResidence:
                        response.data.placeOfResidence || "Not specified",
                    fieldOfWork: response.data.fieldOfWork || "Not specified",
                    mental_health_concerns:
                        response.data.mental_health_concerns || [],
                };
                setUser(formattedData);
            } catch (error) {
                setMessage("Failed to fetch user data");
                setSeverity("error");
                setOpen(true);
            }
        };
        fetchData();
    }, [userId]);

    const mentalStressors = [
        { label: "Stress from Job Search", value: "job_search" }, // Assuming this is the backend name if it were in the data
        { label: "Stress from Classwork", value: "classwork" },
        { label: "Social Anxiety", value: "social_anxiety" },
        { label: "Impostor Syndrome", value: "impostor_syndrome" },
        { label: "Career Drift", value: "career_drift" }, // Assuming this is the backend name if it were in the data
    ];

    const handleMentalHealthChange = (event) => {
        const { name, checked } = event.target;
        setUser((prevState) => {
            const newConcerns = checked
                ? [...prevState.mental_health_concerns, name]
                : prevState.mental_health_concerns.filter(
                      (concern) => concern !== name
                  );
            return { ...prevState, mental_health_concerns: newConcerns };
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiServerAxios.patch(`/user/profile/${userId}`, user);
            setMessage("Profile updated successfully!");
            setSeverity("success");
        } catch (error) {
            setMessage("Failed to update profile");
            setSeverity("error");
        }
        setOpen(true);
    };

    const openDeleteModal = () => {
        setUsername("");
        setIsDeleteRequested(true);
    };

    function closeDeleteModal() {
        setIsDeleteRequested(false);
    }

    async function deleteProfile() {
        setIsDeleteInProgress(true);
        try {
            if (
                usernameCheck.toLowerCase().split(" ").join("") !==
                user.username.toLowerCase().split(" ").join("")
            ) {
                setIsDeleteInProgress(false);
                setErrorMessage("Incorrect username");
                return;
            }
            await apiServerAxios.delete(`/user/delete/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            closeDeleteModal();
            navigate("/auth");
            setMessage("Profile successfully deleted");
            setSeverity("success");
        } catch (error) {
            setMessage("Failed to delete profile");
            setSeverity("error");
        } finally {
            setIsDeleteInProgress(false);
        }
    }

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container
                component="main"
                maxWidth="md"
                sx={{ py: 3, maxHeight: "88vh", overflowY: "auto" }}
            >
                <CustomTabs
                    value={tabValue}
                    onChange={handleTabChange}
                    centered
                >
                    <CustomTab label="Profile" />
                    <CustomTab label="Update Password" />
                    <CustomTab label="Delete Account" />
                </CustomTabs>

                {tabValue === 0 && (
                    <Box>
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{ pb: 5 }}
                        >
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: 500, mb: 2 }}
                            >
                                Profile
                            </Typography>
                            <Box
                                // id="Personal-information"

                                sx={{
                                    p: 4,
                                    border: 3,
                                    mb: 4,
                                    borderColor: "#E7E8F3",
                                    borderRadius: "40px",
                                    boxShadow: 1,
                                    ":hover": {
                                        bgcolor: "#E7E8F3",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{ fontWeight: "bold", fontSize: 20 }}
                                >
                                    Personal Information
                                </Typography>
                                <FormControl variant="standard" sx={{ mt: 3 }}>
                                    <InputLabel
                                        shrink
                                        htmlFor="name"
                                        style={{ fontSize: 20, color: "text" }}
                                    >
                                        Name
                                    </InputLabel>
                                    <BootstrapInput
                                        value={user.name || ""}
                                        id="name"
                                        name="name"
                                        onChange={handleChange}
                                    />
                                </FormControl>
                                <FormControl variant="standard" sx={{ mt: 3 }}>
                                    <InputLabel
                                        shrink
                                        htmlFor="email"
                                        style={{ fontSize: 20, color: "text" }}
                                    >
                                        Email
                                    </InputLabel>
                                    <BootstrapInput
                                        value={user.email || ""}
                                        name="email"
                                        id="email"
                                        onChange={handleChange}
                                    />
                                </FormControl>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                    }}
                                >
                                    <FormControl
                                        variant="standard"
                                        sx={{ mt: 3 }}
                                    >
                                        <InputLabel
                                            shrink
                                            htmlFor="age"
                                            style={{
                                                fontSize: 20,
                                                color: "text",
                                            }}
                                        >
                                            Age
                                        </InputLabel>
                                        <BootstrapInput
                                            value={user.age || ""}
                                            name="age"
                                            id="age"
                                            style={{ width: 200 }}
                                            onChange={handleChange}
                                        />
                                    </FormControl>
                                    <FormControl
                                        variant="standard"
                                        sx={{ mt: 3 }}
                                    >
                                        <InputLabel
                                            shrink
                                            htmlFor="gender"
                                            style={{
                                                fontSize: 20,
                                                color: "text",
                                            }}
                                        >
                                            Gender
                                        </InputLabel>
                                        <Select
                                            name="gender"
                                            style={{ width: 120 }}
                                            value={user.gender || ""}
                                            label="Gender"
                                            onChange={handleChange}
                                            startAdornment={
                                                <IconButton>
                                                    <WcIcon />
                                                </IconButton>
                                            }
                                        >
                                            <MenuItem value="male">
                                                Male
                                            </MenuItem>
                                            <MenuItem value="female">
                                                Female
                                            </MenuItem>
                                            <MenuItem value="other">
                                                Other
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    p: 4,
                                    border: 3,
                                    mb: 4,
                                    borderColor: "#E7E8F3",
                                    borderRadius: "40px",
                                    boxShadow: 1,
                                    ":hover": {
                                        bgcolor: "#E7E8F3",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{ fontWeight: "bold", fontSize: 20 }}
                                >
                                    Personal Address
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 5,
                                    }}
                                >
                                    <FormControl
                                        variant="standard"
                                        sx={{ mt: 3 }}
                                    >
                                        <InputLabel
                                            shrink
                                            htmlFor="place-of-residence"
                                            style={{
                                                fontSize: 20,
                                                color: "text",
                                            }}
                                        >
                                            Place of Residence
                                        </InputLabel>
                                        <BootstrapInput
                                            value={user.placeOfResidence || ""}
                                            name="placeOfResidence"
                                            id="place-of-residence"
                                            onChange={handleChange}
                                        />
                                    </FormControl>
                                    <FormControl
                                        variant="standard"
                                        sx={{ mt: 3 }}
                                    >
                                        <InputLabel
                                            shrink
                                            htmlFor="field-of-work"
                                            style={{
                                                fontSize: 20,
                                                color: "text",
                                            }}
                                        >
                                            Field of Work
                                        </InputLabel>
                                        <BootstrapInput
                                            value={user.fieldOfWork || ""}
                                            name="fieldOfWork"
                                            id="field-of-work"
                                            onChange={handleChange}
                                        />
                                    </FormControl>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    p: 4,
                                    border: 3,
                                    mb: 4,
                                    borderColor: "#E7E8F3",
                                    borderRadius: "40px",
                                    boxShadow: 1,
                                    ":hover": {
                                        bgcolor: "#E7E8F3",
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: "bold",
                                        fontSize: 20,
                                        mb: 3,
                                    }}
                                >
                                    Check all that Apply
                                </Typography>
                                <FormGroup>
                                    {mentalStressors.map((stressor, index) => {
                                        return (
                                            <FormControlLabel
                                                key={index}
                                                sx={{
                                                    borderRadius: 20,
                                                    width: "fit-content",
                                                    px: 1,
                                                    mb: 2,
                                                    bgcolor: "#DBDCE9",
                                                }}
                                                control={
                                                    <Checkbox
                                                        checked={user.mental_health_concerns.includes(
                                                            stressor.value
                                                        )}
                                                        onChange={
                                                            handleMentalHealthChange
                                                        }
                                                        name={stressor.value}
                                                    />
                                                }
                                                label={
                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                    >
                                                        {stressor.label}
                                                        <Tooltip
                                                            title={
                                                                <Typography variant="body2">
                                                                    {getStressorDescription(
                                                                        stressor.value
                                                                    )}
                                                                </Typography>
                                                            }
                                                            arrow
                                                            placement="right"
                                                        >
                                                            <InfoIcon
                                                                color="action"
                                                                style={{
                                                                    marginLeft: 4,
                                                                    fontSize: 20,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </Box>
                                                }
                                            />
                                        );
                                    })}
                                </FormGroup>
                            </Box>
                            <Button
                                type="submit"
                                color="primary"
                                variant="contained"
                                style={{ padding: "10px 15px", float: "right" }}
                                sx={{ borderRadius: 20 }}
                            >
                                Update Profile
                            </Button>
                        </Box>
                    </Box>
                )}
                {tabValue === 1 && <PasswordUpdateTab userId={userId} />}
                {tabValue === 2 && (
                    <Box>
                        <Box
                            sx={{
                                p: 4,
                                border: 3,
                                my: 4,
                                borderColor: "#E7E8F3",
                                borderRadius: "40px",
                                boxShadow: 1,
                                ":hover": {
                                    bgcolor: "#E7E8F3",
                                },
                            }}
                        >
                            <Typography variant="h4" sx={{ color: "red" }}>
                                Delete Account
                            </Typography>
                            <Typography sx={{ my: 2 }}>
                                Once you delete your account, there is no going
                                back. Please be certain.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={openDeleteModal}
                            >
                                Delete your profile
                            </Button>
                        </Box>
                        <DialogBox
                            isDeleteRequested={isDeleteRequested}
                            isDeleteInProgress={isDeleteInProgress}
                            closeDeleteModal={closeDeleteModal}
                            user={user}
                            title="Are you sure you want to do this?"
                            message="We will immediately delete all of your information. To confirm this action, kindly input your username below."
                            okText="Agree"
                            cancelText="Disagree"
                            errorMessage={errorMessage}
                            usernameCheck={usernameCheck}
                            setUsername={setUsername}
                            deleteProfile={deleteProfile}
                            setErrorMessage={setErrorMessage}
                        />
                    </Box>
                )}
                <Snackbar
                    open={open}
                    autoHideDuration={6000}
                    onClose={handleClose}
                >
                    <Alert
                        onClose={handleClose}
                        severity={severity}
                        sx={{ width: "100%" }}
                    >
                        {message}
                    </Alert>
                </Snackbar>
            </Container>
        </ThemeProvider>
    );
}

// Define a function to return descriptions based on stressor id
function getStressorDescription(stressorId) {
    switch (stressorId) {
        case "job_search":
            return "Feelings of stress stemming from the job search process.";
        case "classwork":
            return "Stress related to managing coursework and academic responsibilities.";
        case "social_anxiety":
            return "Anxiety experienced during social interactions or in anticipation of social interactions.";
        case "impostor_syndrome":
            return "Persistent doubt concerning one's abilities or accomplishments coupled with a fear of being exposed as a fraud.";
        case "career_drift":
            return "Stress from uncertainty or dissatisfaction with one's career path or progress.";
        default:
            return "No description available.";
    }
}

export default UserProfile;
