import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import api from "../../services/api";

// import {
//     initOneSignal,
//     registerPushSubscription
// } from "../../services/onesignal";


const AuthContext = createContext();


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [token, setToken] = useState(
        localStorage.getItem("token")
    );

    const [loading, setLoading] = useState(true);


    /*
     * ذخیره اطلاعات ورود
     */
    function saveLogin(data) {

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        setToken(data.token);

        setUser(data.user);
    }


    /*
     * خروج از حساب
     */
    function logout() {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        setToken(null);

        setUser(null);
    }


    /*
     * بازیابی کاربر بعد از Refresh
     */
    useEffect(() => {

        async function loadUser() {

            if (!token) {

                setLoading(false);

                return;
            }


            try {

                const data = await api(
                    "/auth/me",
                    {
                        method: "GET"
                    }
                );


                if (data.success) {

                    setUser(data.user);

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                } else {

                    logout();

                }

            } catch (error) {

                console.error(
                    "Auth restore failed:",
                    error
                );

                logout();

            } finally {

                setLoading(false);

            }

        }


        loadUser();

    }, [token]);


    /*
     * راه‌اندازی OneSignal
     *
     * فقط وقتی کاربر لاگین است.
     */
    // useEffect(() => {

    //     if (!user || !token) {
    //         return;
    //     }


    //     async function setupPush() {

    //         try {

    //             /*
    //              * اول OneSignal را initialize می‌کنیم.
    //              */
    //             await initOneSignal();


    //             /*
    //              * سپس Player ID را می‌گیریم
    //              * و در دیتابیس خودمان ذخیره می‌کنیم.
    //              */
    //             await registerPushSubscription(api);


    //             console.log(
    //                 "OneSignal push setup completed"
    //             );

    //         } catch (error) {

    //             /*
    //              * خطای Push نباید باعث
    //              * logout شدن کاربر شود.
    //              */
    //             console.error(
    //                 "OneSignal setup failed:",
    //                 error
    //             );

    //         }

    //     }


    //     setupPush();

    // }, [user, token]);


    /*
     * نمایش Loading
     */
    if (loading) {

        return (
            <div>
                در حال بررسی ورود...
            </div>
        );

    }


    return (

        <AuthContext.Provider
            value={{
                user,
                token,
                saveLogin,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}


export function useAuth() {

    return useContext(AuthContext);

}