import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../features/auth/AuthContext";


export default function ChangePassword(){

  const navigate = useNavigate();

  const {
    user,
    saveLogin
  } = useAuth();


  const [oldPassword,setOldPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");

  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);



  async function submit(e){

    e.preventDefault();

    setError("");



    if(newPassword !== confirmPassword){

      setError("رمز جدید و تکرار آن یکسان نیست");

      return;

    }



    setLoading(true);



    try{


      await api(
        "/auth/password/change",
        {
          method:"POST",

          body:JSON.stringify({

            oldPassword,

            newPassword,

            confirmPassword

          })

        }
      );



      saveLogin({

        token:localStorage.getItem("token"),

        user:{
          ...user,
          mustChangePassword:0
        }

      });



      navigate("/");


    }
    catch(err){

      setError(err.message);

    }
    finally{

      setLoading(false);

    }

  }





  return (

    <div
      style={{
        width:350,
        margin:"100px auto"
      }}
    >

      <h2>
        تغییر رمز عبور
      </h2>



      <form onSubmit={submit}>


        <input
          type="password"
          placeholder="رمز فعلی"
          value={oldPassword}
          onChange={
            e=>setOldPassword(e.target.value)
          }
        />



        <br/><br/>



        <input
          type="password"
          placeholder="رمز جدید"
          value={newPassword}
          onChange={
            e=>setNewPassword(e.target.value)
          }
        />



        <br/><br/>



        <input
          type="password"
          placeholder="تکرار رمز جدید"
          value={confirmPassword}
          onChange={
            e=>setConfirmPassword(e.target.value)
          }
        />



        <br/><br/>



        {
          error &&
          <p style={{color:"red"}}>
            {error}
          </p>
        }



        <button disabled={loading}>

          {
            loading
            ?
            "در حال ذخیره..."
            :
            "ذخیره رمز"
          }

        </button>



      </form>


    </div>

  );

}