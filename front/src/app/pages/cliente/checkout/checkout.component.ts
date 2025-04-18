import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../../services/carrito.service';
import { Router } from '@angular/router';
import { OrdenService } from '../../../services/ordenes.service';
import { PagosService } from '../../../services/pagos.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  carrito: any = { items: [] };
  resumenOrden: any = null;
  mostrarResumen: boolean = false;
  orden: any = null;

  datosCliente = {
    nombre: '',
    telefono: '',
    direccion: ''
  };

  metodosPago: any[] = [];
  metodoPagoSeleccionado: number | null = null;

  constructor(
    private carritoService: CarritoService,
    private ordenService: OrdenService,
    private pagosService: PagosService,
    private router: Router
  ) {}

  ngOnInit() {
    const ordenStr = localStorage.getItem('orden_generada');
    if (ordenStr) {
      this.orden = JSON.parse(ordenStr);
    }

    this.pagosService.listarMetodosPago().subscribe((res) => {
      this.metodosPago = res;
    });

    const datosGuardados = localStorage.getItem('datosCliente');
    if (datosGuardados) {
      this.datosCliente = JSON.parse(datosGuardados);
    }
  }

  volverInicio() {
    localStorage.removeItem('orden_generada');
    localStorage.removeItem('datosCliente');
    this.router.navigate(['/home']);
  }

  finalizarCompra() {
    if (
      !this.metodoPagoSeleccionado ||
      !this.datosCliente.nombre ||
      !this.datosCliente.telefono ||
      !this.datosCliente.direccion
    ) {
      alert('Por favor completa todos los campos y selecciona un método de pago');
      return;
    }

    // ✅ Paso 1: Guardar los datos del cliente en la orden
    this.ordenService.actualizarDatosCliente(this.orden.id, {
      nombre_cliente: this.datosCliente.nombre,
      direccion: this.datosCliente.direccion,
      telefono: this.datosCliente.telefono
    }).subscribe({
      next: () => {
        // ✅ Paso 2: Registrar el pago
        this.pagosService.crearPago({
          orden_id: this.orden.id,
          metodo_pago_id: this.metodoPagoSeleccionado!,
          monto: this.orden.total,
          estado: 'pendiente'
        }).subscribe({
          next: () => {
            alert('¡Pago registrado! Pronto te contactaremos para coordinar el envío');
            this.volverInicio();
          },
          error: () => {
            alert('Error al registrar el pago');
          }
        });
      },
      error: () => {
        alert('Error al guardar los datos del cliente');
      }
    });

    localStorage.setItem('datosCliente', JSON.stringify(this.datosCliente));
  }
}
