import { useAuth } from "../features/auth/AuthContext";


export default function Header(){

const { user } = useAuth();


return (

<header
style={{
height:"60px",
background:"#fff",
display:"flex",
alignItems:"center",
justifyContent:"space-between",
padding:"0 20px",
borderBottom:"1px solid #ddd"
}}
>


<div>
داشبورد مدیریت
</div>


<div>

{
user &&
<>
{user.name}
&nbsp;
(
{user.phone}
)
</>

}

</div>


</header>

);

}