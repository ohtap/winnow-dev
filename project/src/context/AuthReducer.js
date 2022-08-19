

const AuthReducer = (state, action) => {
    switch (action.type) {
        case "DIRECTORY CHANGE":
            return {
                winnowDir: action.payload,
                recentRunDir: state.recentRunDir,
                error: false
            };
        case "RECENT RUN CHANGE":
            return{
                winnowDir: state.winnowDir,
                recentRunDir: action.payload,
                error:false
            }

        default:
            return state;
    }
};

export default AuthReducer;