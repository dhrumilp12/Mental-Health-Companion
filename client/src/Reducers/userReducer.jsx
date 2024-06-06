const initialState = {
    userInfo: null,
    error: null
};

const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'USER_SIGNUP_SUCCESS':
            return {
                ...state,
                userInfo: action.payload,
                error: null
            };
        case 'USER_SIGNUP_FAIL':
            return {
                ...state,
                error: action.payload
            };
        default:
            return state;
    }
};

export default userReducer;
