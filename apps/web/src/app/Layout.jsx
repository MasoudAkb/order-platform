import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";


export default function Layout(){

return (

<div style={{
display:"flex",
minHeight:"100vh"
}}>


<Sidebar />


<div style={{
flex:1,
background:"#f5f5f5"
}}>

<Header />


<main style={{
padding:"20px"
}}>

<Outlet />

</main>


</div>


</div>

);

}