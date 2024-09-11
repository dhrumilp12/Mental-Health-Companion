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
} from "@mui/material";
import { useEffect, useState } from "react";
import { ring2 } from "ldrs";
import apiServerAxios from "../api/axios";

const theme = createTheme({
    palette: {
        primary: {
            main: "#656782", // Changed to a deep blue shade
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
    },
});

function Routine() {
    const [searchData, setSearchData] = useState({});
    const [isSearchInProgress, setIsSearchInProgress] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [youtubeSearchData, setYoutubeSearchData] = useState([]);
    const [initialLoadedData, setInitialLoadedData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    ring2.register();
    const token = localStorage.getItem("token");

    useEffect(() => {
        // const googleSearchResponse = apiServerAxios.get("/search", {
        //     params: { query: "Breathing", type: "Medication" },
        //     headers: {
        //         Authorization: `Bearer ${token}`,
        //     },
        // });
        // const googleSearchData = googleSearchResponse.data;
        initialLoad();
    }, []);

    async function initialLoad() {
        setIsLoading(true);
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
            const searchHistory = await apiServerAxios.get("/search_history", {
                params: { query: "Breathing", type: "Medication" },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log(searchHistory.data, "SEARCH HISTORY data");
            console.log(youtubeSearchResponse.data, "youtube data");
            setInitialLoadedData(() => [youtubeSearchResponse.data]);
            console.log(initialLoadedData, "loaded data");
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
        console.log("loaded");
    }

    async function searchExercise(e) {
        e.preventDefault();
        setIsSearchInProgress(true);
        try {
            const googleSearchResponse = await apiServerAxios.get("/search", {
                params: searchData,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const youtubeSearchResponse = await apiServerAxios.get(
                "/youtube_search",
                {
                    params: searchData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setYoutubeSearchData((prevValue) => [
                ...prevValue,
                youtubeSearchResponse.data,
            ]);
            console.log(youtubeSearchData, "data printed here");
            console.log(youtubeSearchResponse.data, "youtube data");
            console.log(googleSearchResponse.data, "google data");
            console.log(searchData);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsSearchInProgress(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setSearchData((prevValue) => ({
            ...prevValue,
            [name]: value,
        }));
        console.log(searchData, "in handlechange");
    }

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
            <div style={{ padding: "20px", marginTop: "20px" }}>
                <Box component="section">
                    <Box
                        component="form"
                        onSubmit={searchExercise}
                        sx={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                width: "50%",
                            }}
                        >
                            <TextField
                                id="Google Search"
                                label="Search google"
                                type="search"
                                name="query"
                                value={searchData.query}
                                variant="outlined"
                                onChange={handleChange}
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
                                    value={searchData.type}
                                    label="Exercise"
                                    onChange={handleChange}
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
                            style={{ padding: "10px 15px", float: "right" }}
                            sx={{ borderRadius: 20 }}
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
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "16px",
                            }}
                        >
                            {initialLoadedData[0]
                                ?.slice(0, 3)
                                .map((routine) => {
                                    return (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "10px",
                                            }}
                                            key={routine.id}
                                        >
                                            <iframe
                                                src={routine.videoUrl}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                title={routine.videoTitle}
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
                                                sx={{ textAlign: "justify" }}
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
                    </Box>
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ mb: 2, fontWeight: 600 }}
                        >
                            History{" "}
                        </Typography>
                    </Box>
                    <div style={{ position: "relative" }}>
                        {isSearchInProgress ? (
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: { xs: "50%", md: "60%" },
                                    top: { xs: "50%", md: "40%" },
                                    translate: {
                                        xs: "-50% -50%",
                                        md: "-60% -40%",
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
                        ) : (
                            <Box sx={{ pt: 5 }}>
                                <Typography
                                    variant="h5"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                >
                                    Meditation and Mindfulness Exercise{" "}
                                </Typography>
                                <Box
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "16px",
                                    }}
                                >
                                    {youtubeSearchData[0]?.map(
                                        (
                                            {
                                                description,
                                                videoUrl,
                                                videoTitle,
                                            },
                                            index
                                        ) => {
                                            if (
                                                !description ||
                                                !videoUrl ||
                                                !videoTitle
                                            ) {
                                                console.log("here now");
                                                return null; // Skip rendering this entry if it's invalid
                                            }
                                            return (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyItems:
                                                            "space-between",
                                                    }}
                                                    key={index}
                                                >
                                                    <iframe
                                                        src={videoUrl}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        title={videoTitle}
                                                    ></iframe>
                                                    <Link
                                                        href={videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ fontWeight: 600 }}
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
            </div>
        </ThemeProvider>
    );
}

export default Routine;
