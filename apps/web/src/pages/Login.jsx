import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../features/auth/authApi";
import { useAuth } from "../features/auth/AuthContext";


export default function Login(){

  const navigate = useNavigate();

  const {
    saveLogin
  } = useAuth();


  const [phone,setPhone] = useState("");
  const [password,setPassword] = useState("");

  const [error,setError] = useState("");

  const [loading,setLoading] = useState(false);



  async function handleSubmit(e){

    e.preventDefault();

    setError("");
    setLoading(true);


    try{

      const data = await login(
        phone,
        password
      );


      saveLogin(data);


      if(data.user.mustChangePassword){

        navigate("/change-password");

      }
      else{

        navigate("/");

      }


    }
    catch(err){

      setError(
        err.message
      );

    }
    finally{

      setLoading(false);

    }

  }



  return (

    <div
      style={{
        width:"350px",
        margin:"100px auto"
      }}
    >

      <h2>
        ورود به حساب
      </h2>


      <form onSubmit={handleSubmit}>


        <div>

          <input

            placeholder="شماره موبایل"

            value={phone}

            onChange={
              e=>setPhone(e.target.value)
            }

          />

        </div>


        <br/>


        <div>

          <input

            type="password"

            placeholder="رمز عبور"

            value={password}

            onChange={
              e=>setPassword(e.target.value)
            }

          />

        </div>


        <br/>


        {
          error &&
          <p style={{color:"red"}}>
            {error}
          </p>
        }



        <button
          disabled={loading}
          type="submit"
        >

          {
            loading
            ?
            "در حال ورود..."
            :
            "ورود"
          }

        </button>


      </form>


    </div>

  );

}