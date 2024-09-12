import { useNavigate } from "react-router-dom";
import { Typography, Button, Grid, Container, Box } from "@mui/material";
import TopBar from "./TopBar.jsx";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #121111 60%, #201739 72%, #eec9e6 100%)",
      }}
    >
      <TopBar />
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
                marginBottom: "20px",
                fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
              }}
            >
              Guidance at your fingertips.
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#e0e0e0",
                textAlign: "center",
                marginBottom: "20px",
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              With Earlent, get suggestions for resources to help manage stress
              and improve mental well-being. Earlent is not a replacement for
              therapy but a tool to help you explore the best options available
              and connect you with trusted resources.
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                padding: "10px 20px",
                backgroundColor: "rgba(255, 255, 255, 1.0)",
                color: "#666",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
                marginTop: "40px",
                marginBottom: "20px",
                fontSize: "1.2rem",
              }}
            >
              Prefer to stay anonymous?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#e0e0e0",
                textAlign: "center",
                marginBottom: "40px",
                fontSize: "0.9rem",
              }}
            >
              We understand the need for privacy. Earlent provides an option for
              anonymous login, allowing you to access helpful mental health
              resources without creating an account. Your journey towards
              well-being is our priority, and we respect your right to
              confidentiality.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
