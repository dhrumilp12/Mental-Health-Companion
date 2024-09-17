import {
    Box,
    Button,
    createTheme,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    ThemeProvider,
    Typography,
    Link,
    styled,
    Tabs,
    Tab,
    Snackbar,
    Alert,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { ring2 } from "ldrs";
import apiServerAxios from "../api/axios";
import { RiDeleteBin6Line } from "react-icons/ri";
import { Tooltip } from "react-tooltip";

const theme = createTheme({
    palette: {
        primary: {
            main: "#656782",
        },
    },
    typography: {
        fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif',
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
                    borderRadius: 8,
                    "&:hover": {
                        boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
                    },
                },
            },
        },
    },
});

const CustomTabs = styled(Tabs)({
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    margin: "20px 0",
    maxWidth: "100%",
    overflow: "hidden",
});

const CustomTab = styled(Tab)({
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#3F51B5",
    marginRight: "4px",
    marginLeft: "4px",
    flex: 1,
    maxWidth: "none",
    "&.Mui-selected": {
        color: "#F6AE2D",
        background: "#e0e0e0",
    },
    "&:hover": {
        background: "#f4f4f4",
        transition: "background-color 0.3s",
    },
    "@media (max-width: 720px)": {
        padding: "6px 12px",
        fontSize: "0.8rem",
    },
});

function Routine() {
    const [youTubeSearchQuery, setYouTubeSearchQuery] = useState({});
    const [googleSearchQuery, setGoogleSearchQuery] = useState({});
    const [isSearchInProgress, setIsSearchInProgress] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [youtubeSearchData, setYoutubeSearchData] = useState([]);
    const [googleSearchData, setGoogleSearchData] = useState([]);
    const [initialYouTubeData, setInitialYouTubeData] = useState([]);
    const [initialGoogleData, setInitialGoogleData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [itemsToDisplay, setItemsToDisplay] = useState(3);
    ring2.register();
    const token = localStorage.getItem("token");
    const [tabValue, setTabValue] = useState(0);
    const [message, setMessage] = useState("");
    const [open, setOpen] = useState(false);
    const [severity, setSeverity] = useState("info");

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 1536) {
                setItemsToDisplay(4);
            } else {
                setItemsToDisplay(3);
            }
        }

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const initialLoad = useCallback(async () => {
        setIsLoading(true);

        const cachedYoutubeData = sessionStorage.getItem(
            "initial-youtube-data"
        );
        const cachedGoogleData = sessionStorage.getItem("initial-google-data");
        const cachedHistoryData = sessionStorage.getItem(
            "initial-history-data"
        );
        console.log(JSON.parse(cachedHistoryData), "on fetch");

        if (cachedYoutubeData && cachedGoogleData && cachedHistoryData) {
            setInitialYouTubeData(JSON.parse(cachedYoutubeData));
            setInitialGoogleData(JSON.parse(cachedGoogleData));
            setHistoryData(JSON.parse(cachedHistoryData));
            console.log("in session");
            setIsLoading(false);
            return;
        }

        try {
            const youtubeSearchResponse = await apiServerAxios.get(
                "/youtube_search",
                {
                    params: { query: "Breathing", type: "Medication" },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const googleSearchResponse = await apiServerAxios.get("/search", {
                params: { query: "Breathing", type: "Medication" },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("from server");

            setInitialYouTubeData(youtubeSearchResponse.data);
            setInitialGoogleData(googleSearchResponse.data);

            sessionStorage.setItem(
                "initial-youtube-data",
                JSON.stringify(youtubeSearchResponse.data)
            );
            sessionStorage.setItem(
                "initial-google-data",
                JSON.stringify(googleSearchResponse.data)
            );
        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        initialLoad();
    }, [initialLoad]);

    async function youTubeSearch(e) {
        e.preventDefault();
        setIsSearchInProgress(true);
        try {
            const youtubeSearchResponse = await apiServerAxios.get(
                "/youtube_search",
                {
                    params: youTubeSearchQuery,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            await getSearchHistory();
            setYoutubeSearchData(youtubeSearchResponse.data);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSearchInProgress(false);
        }
    }

    async function googleSearch(e) {
        e.preventDefault();
        setIsSearchInProgress(true);
        try {
            const googleSearchResponse = await apiServerAxios.get("/search", {
                params: googleSearchQuery,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            await getSearchHistory();
            setGoogleSearchData(googleSearchResponse.data);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSearchInProgress(false);
        }
    }

    async function getSearchHistory() {
        const googleSearchHistory = await apiServerAxios.get(
            "/search_history",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        const youtubeSearchHistory = await apiServerAxios.get(
            "/search_history",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        setHistoryData(googleSearchHistory.data);
        setHistoryData(youtubeSearchHistory.data);

        sessionStorage.setItem(
            "initial-history-data",
            JSON.stringify(googleSearchHistory.data)
        );
        sessionStorage.setItem(
            "initial-history-data",
            JSON.stringify(youtubeSearchHistory.data)
        );
    }

    function handleYouTubeInputsChange(e) {
        const { name, value } = e.target;
        setYouTubeSearchQuery((prevValue) => ({
            ...prevValue,
            [name]: value,
        }));
    }
    function handleGoogleInputsChange(e) {
        const { name, value } = e.target;
        setGoogleSearchQuery((prevValue) => ({
            ...prevValue,
            [name]: value,
        }));
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    async function deleteYouTubeSearchHistory() {
        try {
            console.log("entered")
            await apiServerAxios.delete(`/youtube_search_history`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const updatedYouTubeHistoryData = await apiServerAxios.get(
                "/search_history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setHistoryData(updatedYouTubeHistoryData.data);
            sessionStorage.setItem(
                "initial-history-data",
                JSON.stringify(updatedYouTubeHistoryData.data)
            );
            setMessage("YouTube search history deleted successfully!");
            setSeverity("success");
        } catch (error) {
            setMessage("Failed to delete YouTube search history.");
            setSeverity("error");
            console.error(error);
            throw error;
        }
        setOpen(true);
    }

    async function deleteGoogleSearchHistory() {
        try {
            await apiServerAxios.delete("/google_search_history", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const updatedHistoryData = await apiServerAxios.get(
                "/search_history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setHistoryData(updatedHistoryData.data);
            sessionStorage.setItem(
                "initial-history-data",
                JSON.stringify(updatedHistoryData.data)
            );
            setMessage("Google search history deleted successfully!");
            setSeverity("success");
        } catch (error) {
            setMessage("Failed to delete google search history.");
            setSeverity("error");
            console.error(error);
            throw error;
        }
    }

    const handleClose = () => {
        setOpen(false);
    };

    if (isLoading)
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
                    size="40"
                    stroke="5"
                    stroke-length="0.25"
                    bg-opacity="0.1"
                    speed="0.8"
                    color="#656782"
                ></l-ring-2>
            </Box>
        );

    return (
        <ThemeProvider theme={theme}>
            <div
                style={{
                    padding: "20px",
                    marginTop: "20px",
                    marginBottom: "10px",
                }}
            >
                <Box component="section">
                    <CustomTabs
                        value={tabValue}
                        onChange={handleTabChange}
                        centered
                    >
                        <CustomTab label="YouTube Search" />
                        <CustomTab label="Google Search" />
                    </CustomTabs>

                    {tabValue === 0 && (
                        <Box>
                            <Box
                                component="form"
                                onSubmit={youTubeSearch}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: { xs: 3, sm: 7 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: { xs: 2, sm: 5 },
                                        width: { xs: "100%", sm: "50%" },
                                    }}
                                >
                                    <TextField
                                        id="YouTube Search"
                                        label="Search youTube"
                                        type="search"
                                        name="query"
                                        value={youTubeSearchQuery.query}
                                        variant="outlined"
                                        onChange={handleYouTubeInputsChange}
                                        sx={{ width: "50%" }}
                                    />
                                    <FormControl sx={{ width: "50%" }}>
                                        <InputLabel id="routine-exercise">
                                            Exercise
                                        </InputLabel>
                                        <Select
                                            labelId="routine-exercise"
                                            id="demo-simple-select"
                                            name="type"
                                            value={youTubeSearchQuery.type}
                                            label="Exercise"
                                            onChange={handleYouTubeInputsChange}
                                        >
                                            <MenuItem selected>
                                                Choose routine exercise
                                            </MenuItem>
                                            <MenuItem value={"Meditation"}>
                                                Meditation
                                            </MenuItem>
                                            <MenuItem value={"Mindfulness"}>
                                                Mindfulness
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="contained"
                                    style={{
                                        padding: "10px 15px",
                                        float: "right",
                                    }}
                                    sx={{
                                        borderRadius: 20,
                                        width: { xs: "100%", sm: "30%" },
                                        maxWidth: { md: "100px" },
                                    }}
                                >
                                    Search
                                </Button>
                            </Box>
                            <Box sx={{ pt: 5 }}>
                                <Typography
                                    variant="h5"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Meditation and Mindfulness Exercise{" "}
                                </Typography>
                                <Box
                                    sx={{
                                        display: { xs: "flex", md: "grid" },
                                        overflowX: "auto",
                                        gridTemplateColumns: {
                                            md: "repeat(3, 1fr)",
                                            xl: "repeat(4, 1fr)",
                                        },
                                        gap: "16px",
                                    }}
                                >
                                    {initialYouTubeData
                                        ?.slice(0, itemsToDisplay)
                                        .map((routine, index) => {
                                            const embedUrl =
                                                routine.videoUrl.replace(
                                                    "watch?v=",
                                                    "embed/"
                                                );
                                            return (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                    }}
                                                    key={index}
                                                >
                                                    <iframe
                                                        src={embedUrl}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        title={
                                                            routine.videoTitle
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                "black",
                                                        }}
                                                        loading="lazy"
                                                    ></iframe>
                                                    <Link
                                                        href={routine.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {routine.videoTitle}
                                                    </Link>
                                                    <Typography
                                                        sx={{
                                                            textAlign:
                                                                "justify",
                                                        }}
                                                    >
                                                        {
                                                            routine.description.split(
                                                                "."
                                                            )[0]
                                                        }
                                                        ...
                                                    </Typography>
                                                </div>
                                            );
                                        })}
                                </Box>
                                <Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="h5"
                                            sx={{ my: 2, fontWeight: 600 }}
                                        >
                                            History{" "}
                                        </Typography>
                                        <div
                                            onClick={deleteYouTubeSearchHistory}
                                        >
                                            <RiDeleteBin6Line
                                                color={"red"}
                                                size={25}
                                                cursor={"pointer"}
                                            />
                                        </div>
                                    </Box>
                                    {historyData.filter(
                                        (data) =>
                                            data.search_type ===
                                            "youtube_search"
                                    )?.length > 0 ? (
                                        <Box
                                            sx={{
                                                display: {
                                                    xs: "flex",
                                                    md: "grid",
                                                },
                                                overflowX: "auto",
                                                gridTemplateColumns: {
                                                    md: "repeat(3, 1fr)",
                                                    xl: "repeat(4, 1fr)",
                                                },
                                                gap: "16px",
                                            }}
                                        >
                                            {historyData
                                                .filter(
                                                    (data) =>
                                                        data.search_type ===
                                                        "youtube_search"
                                                )
                                                .map((data, index) => {
                                                    const chosenIndex =
                                                        data.queries.length - 1;
                                                    const embedUrl =
                                                        data.queries[0].videoUrl.replace(
                                                            "watch?v=",
                                                            "embed/"
                                                        );
                                                    return (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                gap: "8px",
                                                            }}
                                                            key={index}
                                                        >
                                                            <iframe
                                                                src={embedUrl}
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                allowFullScreen
                                                                title={
                                                                    data
                                                                        .queries[
                                                                        chosenIndex
                                                                    ].videoTitle
                                                                }
                                                                style={{
                                                                    backgroundColor:
                                                                        "black",
                                                                }}
                                                                loading="lazy"
                                                            ></iframe>
                                                            <Link
                                                                href={
                                                                    data
                                                                        .queries[
                                                                        chosenIndex
                                                                    ].videoUrl
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {
                                                                    data
                                                                        .queries[
                                                                        chosenIndex
                                                                    ].videoTitle
                                                                }
                                                            </Link>
                                                            <Typography
                                                                sx={{
                                                                    textAlign:
                                                                        "justify",
                                                                }}
                                                            >
                                                                {
                                                                    data.queries[
                                                                        chosenIndex
                                                                    ].description.split(
                                                                        "."
                                                                    )[0]
                                                                }
                                                                ...
                                                            </Typography>
                                                        </div>
                                                    );
                                                })}
                                        </Box>
                                    ) : (
                                        <Typography variant="h6">
                                            No search History available
                                        </Typography>
                                    )}
                                </Box>
                                <div style={{ position: "relative" }}>
                                    {isSearchInProgress && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: { xs: "50%", md: "55%" },
                                                top: { xs: "50%", md: "40%" },
                                                translate: {
                                                    xs: "-50% -50%",
                                                    md: "-55% -40%",
                                                },
                                            }}
                                        >
                                            <l-ring-2
                                                size="40"
                                                stroke="5"
                                                stroke-length="0.25"
                                                bg-opacity="0.1"
                                                speed="0.8"
                                                color="#656782"
                                            ></l-ring-2>
                                        </Box>
                                    )}
                                    {youtubeSearchData?.length > 0 && (
                                        <Box
                                            sx={{
                                                pt: 5,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 3,
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                Search result{" "}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: {
                                                        xs: "repeat(1, 1fr)",
                                                        sm: "repeat(2, 1fr)",
                                                        md: "repeat(3, 1fr)",
                                                        xl: "repeat(4, 1fr)",
                                                    },
                                                    gap: "16px",
                                                }}
                                            >
                                                {youtubeSearchData?.map(
                                                    (
                                                        {
                                                            description,
                                                            videoUrl,
                                                            videoTitle,
                                                        },
                                                        index
                                                    ) => {
                                                        const embedUrl =
                                                            videoUrl.replace(
                                                                "watch?v=",
                                                                "embed/"
                                                            );
                                                        return (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    justifyItems:
                                                                        "space-between",
                                                                    gap: "8px",
                                                                }}
                                                                key={index}
                                                            >
                                                                <iframe
                                                                    src={
                                                                        embedUrl
                                                                    }
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                    allowFullScreen
                                                                    title={
                                                                        videoTitle
                                                                    }
                                                                    style={{
                                                                        backgroundColor:
                                                                            "black",
                                                                    }}
                                                                    loading="lazy"
                                                                ></iframe>
                                                                <Link
                                                                    href={
                                                                        videoUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {videoTitle}
                                                                </Link>
                                                                <Typography
                                                                    sx={{
                                                                        textAlign:
                                                                            "justify",
                                                                    }}
                                                                >
                                                                    {
                                                                        description.split(
                                                                            "."
                                                                        )[0]
                                                                    }
                                                                    ...
                                                                </Typography>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </div>
                            </Box>
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box>
                            <Box
                                component="form"
                                onSubmit={googleSearch}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: { xs: 3, sm: 7 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: { xs: 2, sm: 5 },
                                        width: { xs: "100%", sm: "50%" },
                                    }}
                                >
                                    <TextField
                                        id="Google Search"
                                        label="Search google"
                                        type="search"
                                        name="query"
                                        value={googleSearchQuery.query}
                                        variant="outlined"
                                        onChange={handleGoogleInputsChange}
                                        sx={{ width: "50%" }}
                                    />
                                    <FormControl sx={{ width: "50%" }}>
                                        <InputLabel id="routine-exercise">
                                            Exercise
                                        </InputLabel>
                                        <Select
                                            labelId="routine-exercise"
                                            id="demo-simple-select"
                                            name="type"
                                            value={googleSearchQuery.type}
                                            label="Exercise"
                                            onChange={handleGoogleInputsChange}
                                        >
                                            <MenuItem selected>
                                                Choose routine exercise
                                            </MenuItem>
                                            <MenuItem value={"Meditation"}>
                                                Meditation
                                            </MenuItem>
                                            <MenuItem value={"Mindfulness"}>
                                                Mindfulness
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="contained"
                                    style={{
                                        padding: "10px 15px",
                                        float: "right",
                                    }}
                                    sx={{
                                        borderRadius: 20,
                                        width: { xs: "100%", sm: "30%" },
                                        maxWidth: { md: "100px" },
                                    }}
                                >
                                    Search
                                </Button>
                            </Box>
                            <Box sx={{ pt: 5 }}>
                                <Typography
                                    variant="h5"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Meditation and Mindfulness Exercise{" "}
                                </Typography>
                                <Box
                                    sx={{
                                        display: { xs: "flex", md: "grid" },
                                        overflowX: "auto",
                                        gridTemplateColumns: {
                                            md: "repeat(3, 1fr)",
                                            xl: "repeat(4, 1fr)",
                                        },
                                        gap: "16px",
                                    }}
                                >
                                    {initialGoogleData
                                        ?.slice(0, itemsToDisplay)
                                        .map((result, index) => {
                                            return (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Link
                                                        href={result.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {result.title}
                                                    </Link>
                                                    <Typography
                                                        sx={{
                                                            textAlign: "start",
                                                        }}
                                                    >
                                                        {result.snippet}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                </Box>
                                <Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="h5"
                                            sx={{ my: 2, fontWeight: 600 }}
                                        >
                                            History{" "}
                                        </Typography>
                                        <div
                                            onClick={deleteGoogleSearchHistory}
                                        >
                                            <RiDeleteBin6Line
                                                color={"red"}
                                                size={25}
                                                cursor={"pointer"}
                                            />
                                        </div>
                                    </Box>
                                    {historyData.filter(
                                        (data) =>
                                            data.search_type === "google_search"
                                    )?.length > 0 ? (
                                        <Box
                                            sx={{
                                                display: {
                                                    xs: "flex",
                                                    md: "grid",
                                                },
                                                overflowX: "auto",
                                                gridTemplateColumns: {
                                                    md: "repeat(3, 1fr)",
                                                    xl: "repeat(4, 1fr)",
                                                },
                                                gap: "16px",
                                            }}
                                        >
                                            {historyData
                                                .filter(
                                                    (data) =>
                                                        data.search_type ===
                                                        "google_search"
                                                )
                                                .map((data, index) => {
                                                    const chosenIndex =
                                                        data.queries.length - 1;
                                                    return (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Link
                                                                href={
                                                                    data
                                                                        .queries[0]
                                                                        .link
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {
                                                                    data
                                                                        .queries[
                                                                        chosenIndex
                                                                    ].title
                                                                }
                                                            </Link>
                                                            <Typography
                                                                sx={{
                                                                    textAlign:
                                                                        "start",
                                                                }}
                                                            >
                                                                {
                                                                    data
                                                                        .queries[
                                                                        chosenIndex
                                                                    ].snippet
                                                                }
                                                            </Typography>
                                                        </Box>
                                                    );
                                                })}
                                        </Box>
                                    ) : (
                                        <Typography variant="h6">
                                            No search History available
                                        </Typography>
                                    )}
                                </Box>
                                <div style={{ position: "relative" }}>
                                    {isSearchInProgress && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: { xs: "50%", md: "55%" },
                                                top: { xs: "50%", md: "40%" },
                                                translate: {
                                                    xs: "-50% -50%",
                                                    md: "-55% -40%",
                                                },
                                            }}
                                        >
                                            <l-ring-2
                                                size="40"
                                                stroke="5"
                                                stroke-length="0.25"
                                                bg-opacity="0.1"
                                                speed="0.8"
                                                color="#656782"
                                            ></l-ring-2>
                                        </Box>
                                    )}
                                    {googleSearchData?.length > 0 && (
                                        <Box
                                            sx={{
                                                pt: 5,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 3,
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                Search result{" "}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: {
                                                        xs: "repeat(1, 1fr)",
                                                        sm: "repeat(2, 1fr)",
                                                    },
                                                    gap: "16px",
                                                }}
                                            >
                                                {googleSearchData
                                                    .splice(0, 6)
                                                    .map((result, index) => {
                                                        return (
                                                            <Box
                                                                key={index}
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Link
                                                                    href={
                                                                        result.link
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {
                                                                        result.title
                                                                    }
                                                                </Link>
                                                                <Typography
                                                                    sx={{
                                                                        textAlign:
                                                                            "start",
                                                                    }}
                                                                >
                                                                    {
                                                                        result.snippet
                                                                    }
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                            </Box>
                                        </Box>
                                    )}
                                </div>
                            </Box>
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
                </Box>
            </div>
        </ThemeProvider>
    );
}

export default Routine;
