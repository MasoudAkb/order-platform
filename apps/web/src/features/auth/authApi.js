import api from "../../services/api";


export async function login(
  phone,
  password
){

  return await api(
    "/auth/login",
    {
      method:"POST",
      body:JSON.stringify({
        phone,
        password
      })
    }
  );

}