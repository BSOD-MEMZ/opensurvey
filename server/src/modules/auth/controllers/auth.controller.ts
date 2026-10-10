import {
  Controller,
  Post,
  Body,
  HttpCode,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../services/user.service';
import { CaptchaService } from '../services/captcha.service';
import { AuthService } from '../services/auth.service';
import { HttpException } from 'src/exceptions/httpException';
import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
import { create } from 'svg-captcha';
import { ApiTags } from '@nestjs/swagger';

// 注册/登录已不再需要验证码与密码强度校验（校园内网自部署，按需放开）。
// 下面的 passwordReg 已废弃，保留注释以便日后恢复。

@ApiTags('auth')
@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    readonly captchaService: CaptchaService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Post('/register')
  @HttpCode(200)
  async register(
    @Body()
    userInfo: {
      username: string;
      password: string;
      captchaId?: string;
      captcha?: string;
    },
  ) {
    // 按设计放开了密码限制：允许空密码与弱密码。
    // 仍然做 ?? 兜底，因为 hash256 收到 undefined 会直接抛异常。
    const password = userInfo.password ?? '';

    const user = await this.userService.createUser({
      username: userInfo.username,
      password,
    });

    const token = await this.authService.generateToken({
      username: user.username,
      _id: user._id.toString(),
    });
    return {
      code: 200,
      data: {
        token,
        username: user.username,
      },
    };
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body()
    userInfo: {
      username: string;
      password: string;
      captchaId?: string;
      captcha?: string;
    },
  ) {
    const password = userInfo.password ?? '';

    const username = await this.userService.getUserByUsername(
      userInfo.username,
    );
    if (!username) {
      throw new HttpException(
        '账号未注册，请进行注册',
        EXCEPTION_CODE.USER_NOT_EXISTS,
      );
    }

    const user = await this.userService.getUser({
      username: userInfo.username,
      password,
    });
    if (user === null) {
      throw new HttpException(
        '用户名或密码错误',
        EXCEPTION_CODE.USER_PASSWORD_WRONG,
      );
    }
    let token;
    try {
      token = await this.authService.generateToken({
        username: user.username,
        _id: user._id.toString(),
      });
    } catch (error) {
      throw new Error(
        'generateToken erro:' +
          error.message +
          this.configService.get<string>('OPENSURVEY_JWT_SECRET') +
          this.configService.get<string>('OPENSURVEY_JWT_EXPIRES_IN'),
      );
    }

    return {
      code: 200,
      data: {
        token,
        username: user.username,
      },
    };
  }

  /**
   * 图形验证码。
   * 注意：注册 / 登录已不再校验验证码，此接口目前仅供冒烟测试与日后恢复使用，
   * 管理端登录页也已移除对应输入框。
   */
  @Post('/captcha')
  @HttpCode(200)
  async getCaptcha(): Promise<{
    code: number;
    data: { id: string; img: string };
  }> {
    const captchaData = create({
      size: 4, // 验证码长度
      ignoreChars: '0o1i', // 忽略字符
      noise: 3, // 干扰线数量
      color: true, // 启用彩色
      background: '#f0f0f0', // 背景色
    });
    const res = await this.captchaService.createCaptcha(captchaData.text);

    return {
      code: 200,
      data: {
        id: res._id.toString(),
        img: captchaData.data,
      },
    };
  }

  /**
   * 密码强度
   */
  @Get('/password/strength')
  @HttpCode(200)
  async getPasswordStrength(@Query('password') password: string) {
    const numberReg = /[0-9]/.test(password);
    const letterReg = /[a-zA-Z]/.test(password);
    const symbolReg = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    // 包含三种、且长度大于8
    if (numberReg && letterReg && symbolReg && password.length >= 8) {
      return {
        code: 200,
        data: 'Strong',
      };
    }

    // 满足任意两种
    if ([numberReg, letterReg, symbolReg].filter(Boolean).length >= 2) {
      return {
        code: 200,
        data: 'Medium',
      };
    }

    return {
      code: 200,
      data: 'Weak',
    };
  }

  @Get('/verifyToken')
  @HttpCode(200)
  async verifyToken(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        code: 200,
        data: false,
      };
    }
    try {
      await this.authService.verifyToken(token);
      return {
        code: 200,
        data: true,
      };
    } catch (error) {
      return {
        code: 200,
        data: false,
      };
    }
  }
}
