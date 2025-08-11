import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../users/users.entity';
import { RefreshToken } from '../refresh_tokens/refresh_tokens.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JwtPayloadSchema } from './schemas/jwt-payload.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private usersRepo: Repository<Users>,
    @InjectRepository(RefreshToken)
    private tokensRepo: Repository<RefreshToken>,
  ) {}

  async login(username: string, password: string, res: Response) {
    const user = await this.usersRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' },
    );

    const tokenEntity = this.tokensRepo.create({
      token: refreshToken,
      user: user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.tokensRepo.save(tokenEntity);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', accessToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { msg: 'Login successful' };
  }

  async refresh(res: Response, token: string) {
    if (!token) throw new UnauthorizedException('No refresh token provided');

    let decodedRaw;

    try {
      decodedRaw = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException(
          'Refresh token expired, please log in again',
        );
      }
      throw new ForbiddenException('Invalid refresh token');
    }

    const result = JwtPayloadSchema.safeParse(decodedRaw);

    if (!result.success) {
      throw new ForbiddenException('Invalid refresh token payload');
    }

    const existing = await this.tokensRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!existing) {
      throw new ForbiddenException('Token not found or already rotated');
    }

    await this.tokensRepo.remove(existing);

    const user = existing.user;

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' },
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' },
    );

    const newEntity = this.tokensRepo.create({
      token: newRefreshToken,
      user: user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.tokensRepo.save(newEntity);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { msg: 'Token refreshed successfully' };
  }

  async logout(token: string, res: Response) {
    if (!token) throw new UnauthorizedException('No refresh token provided');

    let decodedRaw;

    try {
      decodedRaw = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException(
          'Refresh token expired, please log in again',
        );
      }
      throw new ForbiddenException('Invalid refresh token');
    }

    const result = JwtPayloadSchema.safeParse(decodedRaw);

    if (!result.success) {
      throw new ForbiddenException('Invalid refresh token payload');
    }

    const existing = await this.tokensRepo.findOne({ where: { token } });
    if (existing) await this.tokensRepo.remove(existing);

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    return { msg: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response) {
    await this.tokensRepo.delete({ user: { id: userId } }); // Delete all refresh tokens for the user

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    return { msg: 'Logged out from all devices' };
  }
}
