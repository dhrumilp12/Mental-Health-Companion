import { Container, Typography, Box } from "@mui/material";
import TopBar from "./TopBar";

const FAQPage = () => {
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
          Frequently Asked Questions
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#e0e0e0", textAlign: "center", fontSize: "1.2rem" }}
        >
          Here are some common questions we receive:
        </Typography>

        <Typography
          variant="h6"
          sx={{ color: "#fff", mt: 4, fontWeight: "bold" }}
        >
          Q: Is Earlent a replacement for therapy?
        </Typography>
        <Typography variant="body1" sx={{ color: "#e0e0e0" }}>
          A: No, Earlent is not a replacement for therapy. It’s a tool that
          helps users explore available mental health resources and connect with
          professionals if necessary.
        </Typography>

        <Typography
          variant="h6"
          sx={{ color: "#fff", mt: 4, fontWeight: "bold" }}
        >
          Q: Is my privacy protected when using EarlentAI?
        </Typography>
        <Typography variant="body1" sx={{ color: "#e0e0e0" }}>
          A: Yes, we prioritize your privacy. EarlentAI offers anonymous login
          options to protect your identity.
        </Typography>
      </Container>
    </Box>
  );
};

export default FAQPage;
