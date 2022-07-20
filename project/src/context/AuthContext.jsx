/*
 * Snagged this from a tutorial by PedroTech on youtube. Combines context with useReducer hook to create a rudimentary state management tool.
    We are using this tool to pass around the winnowDir and associaed permissions for the working directory of Winnow.
 */

import { createContext, useReducer } from "react";
import AuthReducer from "./AuthReducer";

const INITIAL_STATE = {
    winnowDir: null,
    error: false
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

    return (
        <AuthContext.Provider
            value={{
                winnowDir: state.winnowDir,
                error: state.error,
                dispatch
            }}>
            {children}
        </AuthContext.Provider>
    );
}