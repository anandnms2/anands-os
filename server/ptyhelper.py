# Runs a command inside a real terminal (pty). stdin/stdout carry the terminal bytes; fd 3 carries "cols rows" lines for resizing.
import os, pty, sys, select, struct, fcntl, termios, signal, errno

def main():
    cols, rows = int(sys.argv[1]), int(sys.argv[2]); cmd = sys.argv[3:]
    pid, fd = pty.fork()
    if pid == 0:
        try: os.execvp(cmd[0], cmd)
        except Exception as e:
            os.write(2, ('cannot start %s: %s\n' % (cmd[0], e)).encode()); os._exit(127)
    def size(c, r):
        try: fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', max(r, 1), max(c, 1), 0, 0)); os.kill(pid, signal.SIGWINCH)
        except Exception: pass
    size(cols, rows)
    ctl = b''; code = 0
    try:
        while True:
            try: r, _, _ = select.select([0, fd, 3], [], [])
            except InterruptedError: continue
            if fd in r:
                try: d = os.read(fd, 65536)
                except OSError: d = b''
                if not d: break
                os.write(1, d)
            if 0 in r:
                d = os.read(0, 65536)
                if not d: break
                os.write(fd, d)
            if 3 in r:
                try: d = os.read(3, 256)
                except OSError: d = b''
                if d:
                    ctl += d
                    while b'\n' in ctl:
                        line, ctl = ctl.split(b'\n', 1)
                        try: c, rr = line.split(); size(int(c), int(rr))
                        except Exception: pass
    finally:
        try: os.kill(pid, signal.SIGHUP)
        except Exception: pass
        try:
            _, st = os.waitpid(pid, 0); code = os.WEXITSTATUS(st) if os.WIFEXITED(st) else 1
        except Exception: pass
    sys.exit(code)
main()
