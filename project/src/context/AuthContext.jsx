/*
 * Snagged this from a tutorial by PedroTech on youtube. Combines context with useReducer hook to create a rudimentary state management tool.
    We are using this tool to pass around the winnowDir and associaed permissions for the working directory of Winnow.
 */

import { createContext, useReducer } from "react";
import AuthReducer from "./AuthReducer";

// TODO: make use of the error field by writing error dispatches and logging them along with recovery logic if the error state is true.
const INITIAL_STATE = {
    winnowDir: null,
    recentRunDir: null,

    error: false
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

    return (
        <AuthContext.Provider
            value={{
                winnowDir: state.winnowDir,
                recentRunDir: state.recentRunDir,
                error: state.error,
                dispatch
            }}>
            {children}
        </AuthContext.Provider>
    );
}