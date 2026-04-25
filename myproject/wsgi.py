"""WSGI config for myproject.

It exposes the WSGI callable as a module-level variable named ``application``.
"""

import os

from django.core.wsgi import get_wsgi_application


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings_render')

# resource is Unix-only. Skip memory limiting on Windows.
if os.name != 'nt':
    try:
        import resource

        memory_limit = 512 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))
    except Exception:
        pass

application = get_wsgi_application()