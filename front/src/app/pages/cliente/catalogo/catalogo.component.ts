import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, ProductoService } from '../../../services/producto.service';
import { SubcategoriaService } from '../../../services/subcategorias.service';
import { CarritoService } from '../../../services/carrito.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class CatalogoComponent implements OnInit {
  subcategorias: any[] = [];
  productos: Producto[] = [];
  productosOriginal: Producto[] = []; // respaldo para filtros
  cantidades: { [id: number]: number } = {};
  subcategoriaSeleccionada: number | null = null;

  // Paginación
  paginaActual: number = 1;
  productosPorPagina: number = 16;
  paginas: number[] = [];

  constructor(
    private productoService: ProductoService,
    private subcategoriaService: SubcategoriaService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.subcategoriaService.listar().subscribe((res) => {
      this.subcategorias = res;
      if (res.length > 0) {
        this.seleccionarSubcategoria(res[0].id);
      }
    });

    this.generarSessionIdSiNoExiste();
  }

  generarSessionIdSiNoExiste() {
    const id = localStorage.getItem('session_id');
    if (!id) {
      const nuevoId = crypto.randomUUID();
      localStorage.setItem('session_id', nuevoId);
    }
  }

  seleccionarSubcategoria(id: number) {
    this.subcategoriaSeleccionada = id;
    this.paginaActual = 1;

    this.productoService.obtenerPorSubcategoria(id).subscribe((res) => {
      this.productosOriginal = res;
      this.productos = [...res]; // copia
      this.generarPaginas();
    });
  }

  agregarAlCarrito(producto: Producto) {
    const cantidad = this.cantidades[producto.id] || 1;

    if (cantidad > producto.stock) {
      alert('La cantidad supera el stock disponible.');
      return;
    }

    const session_id = localStorage.getItem('session_id')!;

    this.carritoService.agregarProducto(producto.id, cantidad, session_id).subscribe({
      next: () => {
        alert('Producto agregado al carrito');
        this.cantidades[producto.id] = 1;
        this.carritoService.refrescarCantidad();
      },
      error: () => {
        alert('Ocurrió un error al agregar al carrito');
      }
    });
  }

  // Paginación
  generarPaginas() {
    const totalPaginas = Math.ceil(this.productos.length / this.productosPorPagina);
    this.paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  get productosPaginados(): Producto[] {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    return this.productos.slice(inicio, fin);
  }

  paginaSiguiente() {
    if (this.paginaActual < this.paginas.length) {
      this.paginaActual++;
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  irAPagina(pagina: number) {
    this.paginaActual = pagina;
  }

  // Filtro por precio
  filtrarPorPrecio(min: number, max: number) {
    this.productos = this.productosOriginal.filter(
      (p) => p.precio >= min && p.precio <= max
    );
    this.paginaActual = 1;
    this.generarPaginas();
  }
}
