import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { MetodoPago } from './entities/metodo-pago.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepo: Repository<Pago>,

    @InjectRepository(MetodoPago)
    private metodoRepo: Repository<MetodoPago>
  ) {}

  async crearPago(dto: CreatePagoDto) {
    const metodo = await this.metodoRepo.findOne({ where: { id: dto.metodo_pago_id } });
    if (!metodo) throw new NotFoundException('Método de pago no válido');

    const pago = this.pagoRepo.create({
      ...dto,
      estado: dto.estado || 'completado',
    });

    return this.pagoRepo.save(pago);
  }

  async listarPagosPorOrden(orden_id: number) {
    return this.pagoRepo.find({
      where: { orden_id },
      relations: ['metodo'],
    });
  }

  async listarMetodosDePago() {
    return this.metodoRepo.find();
  }

  async crearMetodo(nombre: string, descripcion?: string) {
    const metodo = this.metodoRepo.create({ nombre, descripcion });
    return this.metodoRepo.save(metodo);
  }
}
