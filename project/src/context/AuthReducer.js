import { runResults } from "./AuthActions";

const AuthReducer = (state, action) => {
    switch (action.type) {
        case "DIRECTORY CHANGE":
            return {
                winnowDir: action.payload,
                recentRunDir: state.recentRunDir,
                runResults: state.runResults,
                error: false
            };
        case "RECENT RUN CHANGE":
            return{
                winnowDir: state.winnowDir,
                recentRunDir: action.payload,
                runResults: state.runResults,
                error:false
            }
        case "RUN RESULTS":
            return{
                winnowDir: state.winnowDir,
                recentRunDir:state.recentRunDir,
                runResults: action.payload,
                error:false
            }
        default:
            return state;
    }
};

export default AuthReducer;