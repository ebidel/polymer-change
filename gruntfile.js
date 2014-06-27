module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      slides: {
        files: ['scripts/md/*.{md,html}'],
        tasks: ['shell']
      },
      theme: {
        files: ['theme/scss/**/*.scss'],
        tasks: ['compass']
      }
    },
    shell: {
      render: {
        command: 'python render.py',
        options: {
          execOptions: {
            cwd: 'scripts/md'
          },
          stdout: true,
          stderr: true
        }
      }
    },
    compass: {
      dist: {
        options: {
          config: 'config.rb'
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9001
        }
      }
    }
  });

  grunt.registerTask('default', ['build', 'connect', 'watch']);
  grunt.registerTask('build', ['shell', 'compass']);

};
