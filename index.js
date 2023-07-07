const axios = require('axios');
const fs = require('fs');
const simpleGit = require('simple-git');

const baseUrl = 'https://pokeapi.co/api/v2/';

class Domains {
  constructor(domain, subdomain) {
    this.domain = domain;
    this.subdomain = subdomain;
  }
}

class InformedDomain {
  constructor(area, domains) {
    this.area = area;
    this.domains = domains;
  }
}

function getAllPk() {
  let url = baseUrl + 'pokemon';

  // Make request
  axios
    .get(url)
    .then(res => {
      filterPkName(res.data);
      console.log('FIN');
    })
    .catch(err => console.log(err));
}

function filterPkName(data) {
  const areas = [];

  for (const res of data.results) {
    getPkByName(res.name, area => {
      areas.push(area);

      // Verificar si se completaron todas las áreas
      if (areas.length === data.results.length) {
        addSubdomainValues(areas, () => {
          const jsonData = {
            areas: areas
          };

          fs.writeFile('archivo.json', JSON.stringify(jsonData, null, 2), 'utf8', err => {
            if (err) {
              console.error('Error al escribir el archivo:', err);
              return;
            }
            console.log('Archivo JSON escrito correctamente.');
          });
        });
      }
    });
  }
}

function getPkByName(name, callback) {
  let url = baseUrl + 'pokemon/' + name;

  // Make request
  axios
    .get(url)
    .then(res => {
      const domains = res.data.abilities.map(item => new Domains(item.ability.name, []));
      const informedDomain = new InformedDomain(name, domains);

      // Ejecutar el callback con el área completada
      callback(informedDomain);
    })
    .catch(err => console.log(err));
}

function addSubdomainValues(areas, callback) {
  let totalDomains = 0;
  let totalSubdomains = 0;

  for (const area of areas) {
    totalDomains += area.domains.length;

    for (const domain of area.domains) {
      getPkByAbilities(domain.domain, res => {
        domain.subdomain.push(res.data.id);
        totalSubdomains++;

        if (totalSubdomains === totalDomains) {
          callback();
        }
      });
    }
  }
}

function getPkByAbilities(ability, callback) {
  let url = baseUrl + 'ability/' + ability;

  // Make request
  axios
    .get(url)
    .then(res => {
      callback(res);
    })
    .catch(err => console.log(err));
}


function gitUpdate() {
  const repoPath = '/ruta/a/tu/repositorio';
  const fileName = 'archivo.json';
  const commitMessage = 'Updtae Informed Domains dictionary';

  // Crear una instancia de simple-git
  const git = simpleGit(repoPath);

  // Realizar un pull para obtener los últimos cambios del repositorio (opcional)
  git.pull();

  // Agregar el archivo JSON al área de preparación
  git.add(fileName);

  // Realizar un commit con un mensaje
  git.commit(commitMessage);

  // Subir los cambios al repositorio remoto
  git.push();
}

getAllPk();
