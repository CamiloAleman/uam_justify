import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export function successAlert(message = "Operación realizada") {
  return Swal.fire({
    icon: "success",
    title: "Éxito",
    text: message,
    timer: 1800,
    showConfirmButton: false,
  });
}

export function errorAlert(message = "Ocurrió un error") {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
  });
}

export function confirmAlert(message = "¿Confirmas esta acción?") {
  return Swal.fire({
    icon: "warning",
    title: "Confirmar",
    text: message,
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "Cancelar",
  });
}
