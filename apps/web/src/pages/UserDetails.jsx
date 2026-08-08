import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UserDetails(){

const {id}=useParams();
const navigate=useNavigate();

const [data,setData]=useState(null);
const [loading,setLoading]=useState(true);


useEffect(()=>{

async function load(){

try{

const result = await api(`/admin/users/${id}`);

setData(result);

}
catch(err){

console.log(err);

}

finally{

setLoading(false);

}

}

load();

},[id]);



if(loading)
return <h3>در حال دریافت اطلاعات...</h3>


if(!data)
return <h3>کاربر پیدا نشد</h3>


return (

<div>

<button
onClick={()=>navigate("/users")}
>
بازگشت
</button>


<h1>
جزئیات کاربر
</h1>


<h3>
نام: {data.user.name}
</h3>


<h3>
تلفن: {data.user.phone}
</h3>


<h3>
موجودی:
{data.user.balance}
</h3>



<h2>
سفارش‌ها
</h2>


{
data.orders.map(order=>(

<div key={order.id}>

#{order.id}
-
{order.title}
-
{order.status}

</div>

))
}


<h2>
تراکنش‌ها
</h2>


{
data.transactions.map(t=>(

<div key={t.id}>

{t.amount}

</div>

))
}


</div>

)

}