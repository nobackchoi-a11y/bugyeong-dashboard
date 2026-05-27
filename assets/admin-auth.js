
// 관리자 비밀번호 잠금
// 임시 비밀번호는 아래 값에서 변경하세요.
const BUGYEONG_ADMIN_PASSWORD = "2580";

function requireAdminPassword(){
  const ok = sessionStorage.getItem("bugyeong_admin_ok") === "Y";
  if(ok) return true;
  const input = prompt("관리자 비밀번호를 입력하세요.");
  if(input === BUGYEONG_ADMIN_PASSWORD){
    sessionStorage.setItem("bugyeong_admin_ok","Y");
    return true;
  }
  alert("비밀번호가 맞지 않습니다.");
  location.href = "./index.html";
  return false;
}
requireAdminPassword();
