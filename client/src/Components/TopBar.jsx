import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "transparent", boxShadow: "none" }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => navigate("/landing_page")}
        >
          Earlent Mental Health Companion
        </Typography>

        {/* TopBar Links */}
        <Button
          sx={{ color: "#fff", marginRight: 2 }}
          onClick={() => navigate("/about")}
        >
          About
        </Button>
        <Button sx={{ color: "#fff" }} onClick={() => navigate("/faq")}>
          FAQ
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
