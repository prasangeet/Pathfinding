from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
import sys

class get_pybind_include:
    def __str__(self):
        import pybind11
        return pybind11.get_include()

ext_modules = [
    Extension(
        'dijkstra',
        ['dijkstra.cpp'],
        include_dirs=[
            get_pybind_include(),
        ],
        language='c++',
    )
]

class BuildExt(build_ext):
    """A custom build extension for adding compiler-specific options."""
    c_opts = {
        'msvc': ['/EHsc', '/std:c++17'],  # Added /std:c++17 flag for MSVC
        'unix': [],
    }
    l_opts = {
        'msvc': [],
        'unix': [],
    }

    def build_extensions(self):
        ct = self.compiler.compiler_type
        opts = self.c_opts.get(ct, [])
        link_opts = self.l_opts.get(ct, [])
        if ct == 'unix':
            opts.append('-DVERSION_INFO="%s"' % self.distribution.get_version())
            opts.append('-std=c++17')  # Explicitly set C++17 for Unix
            if hasattr(self.compiler, 'compiler_so'):
                if '-std=c++17' not in self.compiler.compiler_so:
                    self.compiler.compiler_so.append('-std=c++17')
        elif ct == 'msvc':
            opts.append('/DVERSION_INFO=\\"%s\\"' % self.distribution.get_version())
        for ext in self.extensions:
            ext.extra_compile_args = opts
            ext.extra_link_args = link_opts
        build_ext.build_extensions(self)

setup(
    name='dijkstra',
    version='0.0.1',
    ext_modules=ext_modules,
    cmdclass={'build_ext': BuildExt},
    zip_safe=False,
)