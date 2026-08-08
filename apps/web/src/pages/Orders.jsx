import { useEffect, useState } from "react";
import api from "../services/api";

export default function Orders() {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        async function load() {

            try {

                const data = await api("/admin/orders");

                setOrders(data.orders || []);

            }
            catch (err) {

                console.log(err);
                setError(err.message);

            }
            finally {

                setLoading(false);

            }

        }

        load();

    }, []);



    if (loading) {

        return <h3>در حال دریافت سفارش‌ها...</h3>;

    }


    if (error) {

        return <h3 style={{ color: "red" }}>{error}</h3>;

    }



    return (

        <div>

            <h2>
                سفارش‌ها
            </h2>


            <table
                style={{
                    width: "100%",
                    background: "#fff",
                    borderCollapse: "collapse"
                }}
            >

                <thead>

                    <tr>

                        <th>شماره</th>
                        <th>مشتری</th>
                        <th>تلفن</th>
                        <th>وضعیت</th>
                        <th>تاریخ</th>

                    </tr>

                </thead>


                <tbody>


                    {
                        orders.map(item => {


                            const order = item.order;
                            const user = item.user;


                            return (

                                <tr
                                    key={order.id}
                                    onClick={() => {
                                        window.location.href = `/orders/${order.id}`;
                                    }}
                                    style={{
                                        cursor: "pointer"
                                    }}
                                >


                                    <td>
                                        {order.id}
                                    </td>


                                    <td>
                                        {user?.name || "-"}
                                    </td>


                                    <td>
                                        {user?.phone || "-"}
                                    </td>


                                    <td>
                                        {order.status}
                                    </td>


                                    <td>
                                        {
                                            new Date(order.createdAt)
                                                .toLocaleDateString("fa-IR")
                                        }
                                    </td>


                                </tr>

                            );


                        })
                    }


                </tbody>


            </table>


        </div>

    );

}