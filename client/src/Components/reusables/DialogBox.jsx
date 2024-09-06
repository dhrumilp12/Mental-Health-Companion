// import React from 'react'

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";
import { ring2 } from "ldrs";
import PropTypes from "prop-types";

function DialogBox({
    isDeleteRequested,
    isDeleteInProgress,
    closeDeleteModal,
    user,
    errorMessage,
    usernameCheck,
    deleteProfile,
    setErrorMessage,
    setUsername,
    title,
    message,
    okText,
    cancelText,
}) {
    ring2.register();

    return (
        <Dialog open={isDeleteRequested} onClose={closeDeleteModal}>
            {isDeleteInProgress ? (
                <l-ring-2
                    size="60"
                    stroke="5"
                    stroke-length="0.25"
                    bg-opacity="0.1"
                    speed="0.8"
                    color="#656782"
                ></l-ring-2>
            ) : (
                <Box>
                    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {message}
                        </DialogContentText>
                        <Box sx={{ mt: 2,}}>
                            <Typography sx={{ mb: 1, display: "flex", gap: 1 }}>
                                Type{" - "}
                                <Typography sx={{ fontWeight: 700 }}>
                                    {user.username}
                                </Typography>
                            </Typography>
                            <TextField
                                required
                                id="outlined-required"
                                sx={{
                                    width: "100%",
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": {
                                            borderColor: errorMessage
                                                ? "red"
                                                : "",
                                        },
                                        "&:hover fieldset": {
                                            borderColor: errorMessage
                                                ? "red"
                                                : "",
                                        },
                                        "&.Mui-focused fieldset": {
                                            borderColor: errorMessage
                                                ? "red"
                                                : "",
                                        },
                                    },
                                }}
                                value={usernameCheck}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setErrorMessage(null);
                                }}
                            />
                            {errorMessage && (
                                <Typography
                                    sx={{
                                        color: "red",
                                        mt: "5px",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errorMessage}
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDeleteModal}>{cancelText}</Button>
                        <Button onClick={deleteProfile} autoFocus>
                            {okText}
                        </Button>
                    </DialogActions>
                </Box>
            )}
        </Dialog>
    );
}

DialogBox.propTypes = {
    isDeleteRequested: PropTypes.bool,
    isDeleteInProgress: PropTypes.bool,
    errorMessage: PropTypes.string,
    setErrorMessage: PropTypes.func,
    usernameCheck: PropTypes.string,
    setUsername: PropTypes.func,
    user: PropTypes.object,
    closeDeleteModal: PropTypes.func,
    deleteProfile: PropTypes.func,
    title: PropTypes.string,
    message: PropTypes.string,
    okText: PropTypes.string,
    cancelText: PropTypes.string,
};

export default DialogBox;
