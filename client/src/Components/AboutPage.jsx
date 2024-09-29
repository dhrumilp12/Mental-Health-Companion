import { Container, Typography, Box } from "@mui/material";
import TopBar from "./TopBar";

const AboutPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #121111 60%, #201739 72%, #eec9e6 100%)",
      }}
    >
      <TopBar />

      <Container maxWidth="md" sx={{ pt: 8 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
            mb: 4,
          }}
        >
          About Earlent Mental Health Companion
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#e0e0e0", textAlign: "center", fontSize: "1.2rem" }}
        >
          Earlent is a mental health companion designed to provide resources and
          guidance to manage stress and improve well-being. We aim to connect
          users with trusted mental health tools, professionals, and resources
          while respecting privacy and confidentiality.
        </Typography>
      </Container>
    </Box>
  );
};

export default AboutPage;
