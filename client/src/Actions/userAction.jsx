import axiosInstance from '../Utils/axiosInstance';

export const signUpUser = (userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('user/signup', userData);
        dispatch({
            type: 'USER_SIGNUP_SUCCESS',
            payload: response.data
        });
    } catch (error) {
        dispatch({
            type: 'USER_SIGNUP_FAIL',
            payload: error.response.data.error
        });
    }
};
