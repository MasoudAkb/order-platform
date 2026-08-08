import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Users(){

    const [users,setUsers] = useState([]);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");

    const navigate = useNavigate();


    useEffect(()=>{

        async function load(){

            try{

                const data = await api("/admin/users");

                setUsers(data.users || []);

            }catch(err){

                setError(err.message);

            }finally{

                setLoading(false);

            }

        }

        load();

    },[]);



    if(loading){

        return <h3>در حال دریافت کاربران...</h3>;

    }


    if(error){

        return (
            <h3 style={{color:"red"}}>
                {error}
            </h3>
        );

    }


    return (

        <div>

            <h2>
                کاربران
            </h2>


            <table
            style={{
                width:"100%",
                background:"#fff",
                borderCollapse:"collapse"
            }}
            >

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>نام</th>
                        <th>تلفن</th>
                        <th>موجودی</th>
                        <th>تعداد سفارش</th>
                        <th>نقش</th>

                    </tr>

                </thead>


                <tbody>


                {
                    users.map(user=>(

                        <tr
                        key={user.id}
                        onClick={()=>navigate(`/users/${user.id}`)}
                        style={{
                            cursor:"pointer"
                        }}
                        >

                            <td>
                                {user.id}
                            </td>


                            <td>
                                {user.name}
                            </td>


                            <td>
                                {user.phone}
                            </td>


                            <td>
                                {
                                Number(user.balance)
                                .toLocaleString("fa-IR")
                                }
                                {" تومان"}
                            </td>


                            <td>
                                {user.ordersCount}
                            </td>


                            <td>
                                {user.role}
                            </td>


                        </tr>

                    ))
                }


                </tbody>


            </table>


        </div>

    );

}