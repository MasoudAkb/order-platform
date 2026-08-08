import { useEffect, useState } from "react";
import api from "../services/api";


export default function Dashboard(){

const [data,setData] = useState(null);
const [loading,setLoading] = useState(true);


useEffect(()=>{

async function load(){

try{

const result = await api(
"/admin/dashboard"
);

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

},[]);



if(loading){

return <h2>در حال دریافت اطلاعات...</h2>;

}



if(!data){

return <h2>خطا در دریافت اطلاعات</h2>;

}



return (

<div>


<h1>
داشبورد مدیریت
</h1>



<div
style={{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:"20px"
}}
>


<Card
title="تعداد سفارش‌ها"
value={data.orders}
/>



<Card
title="تعداد کاربران"
value={data.users}
/>



<Card
title="وضعیت مالی"
value={data.finance}
/>



</div>



</div>

);


}



function Card({title,value}){

return (

<div
style={{
background:"#fff",
padding:"20px",
borderRadius:"10px",
boxShadow:"0 2px 8px #ddd"
}}
>

<h3>
{title}
</h3>


<pre>
{
typeof value === "object"
?
JSON.stringify(value,null,2)
:
value
}
</pre>


</div>

);

}