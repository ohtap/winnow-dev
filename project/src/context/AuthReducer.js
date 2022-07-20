const AuthReducer = (state, action) => {
    switch (action.type) {
        case "DIRECTORY CHANGE":
            return {
                winnowDir: action.payload,
                error: false
            };
        default:
            return state;
    }
};

export default AuthReducer;