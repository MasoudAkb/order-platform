// src/services/onesignal.js

const APP_ID = "5be8224d-1763-4aa6-9d1f-2447e9fd191a";

let initialized = false;
let initializationPromise = null;


/**
 * مقداردهی اولیه OneSignal
 */
export async function initOneSignal() {

    // اگر قبلاً initialize شده
    if (initialized) {
        return true;
    }

    // اگر همزمان چند بار صدا زده شد،
    // همه همان Promise را استفاده کنند.
    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = new Promise((resolve, reject) => {

        if (!window.OneSignalDeferred) {
            window.OneSignalDeferred = [];
        }


        window.OneSignalDeferred.push(
            async function (OneSignal) {

                try {

                    await OneSignal.init({
                        appId: APP_ID,

                        allowLocalhostAsSecureOrigin: true,

                        notifyButton: {
                            enable: false
                        }
                    });


                    initialized = true;

                    console.log(
                        "OneSignal initialized successfully"
                    );


                    resolve(true);

                } catch (error) {

                    console.error(
                        "OneSignal initialization failed:",
                        error
                    );

                    initializationPromise = null;

                    reject(error);

                }

            }
        );

    });


    return initializationPromise;
}



/**
 * دریافت Player ID کاربر
 */
export async function getOneSignalPlayerId() {

    try {

        await initOneSignal();


        const OneSignal = window.OneSignal;


        if (!OneSignal) {

            console.error(
                "OneSignal object not available"
            );

            return null;

        }


        const playerId =
            OneSignal.User?.PushSubscription?.id;


        if (!playerId) {

            console.log(
                "OneSignal Player ID is not available yet"
            );

            return null;

        }


        console.log(
            "OneSignal Player ID:",
            playerId
        );


        return playerId;

    } catch (error) {

        console.error(
            "Failed to get OneSignal Player ID:",
            error
        );

        return null;

    }

}



/**
 * درخواست اجازه Push
 */
export async function requestPushPermission() {

    try {

        await initOneSignal();


        const OneSignal = window.OneSignal;


        if (!OneSignal) {
            return false;
        }


        const permission =
            await OneSignal.Notifications.requestPermission();


        console.log(
            "OneSignal permission:",
            permission
        );


        return permission === true;

    } catch (error) {

        console.error(
            "Push permission request failed:",
            error
        );

        return false;

    }

}



/**
 * ثبت Player ID در بک‌اند
 */
export async function registerPushSubscription(api) {

    try {

        const playerId =
            await getOneSignalPlayerId();


        if (!playerId) {

            console.log(
                "No OneSignal Player ID to register"
            );

            return false;

        }


        const result =
            await api(
                "/push-subscriptions",
                {
                    method: "POST",

                    body: JSON.stringify({
                        playerId
                    })
                }
            );


        if (!result.success) {

            console.error(
                "Push subscription registration failed:",
                result
            );

            return false;

        }


        console.log(
            "Push subscription registered successfully"
        );


        return true;

    } catch (error) {

        console.error(
            "Push subscription registration error:",
            error
        );

        return false;

    }

}
