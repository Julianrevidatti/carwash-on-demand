using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TP1___Programacion_III
{
    public partial class Ejercicio1 : Form
    {
        public Ejercicio1(FormPrincipal formPrincipal)
        {
            InitializeComponent();
            
        }

        private void btnEjercicio1_Click(object sender, EventArgs e)
        {
            string nuevoNombre = txtEjercicio1.Text.Trim().ToUpper();

            if (nuevoNombre.Length > 0)
            {
                foreach (string item in listBox1.Items)
                {
                    if (item.ToUpper() == nuevoNombre)
                    {
                        MessageBox.Show("El nombre ya ha sido ingresado, intenta con otro.");
                        return;
                    }
                }

                listBox1.Items.Add(txtEjercicio1.Text.Trim());
                txtEjercicio1.Text = "";
            }
            else
            {
                MessageBox.Show("Ingresa un nombre rey, No dejes el espacio vacío");
            }
        }

        private void listBox2_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {

            if (listBox1.SelectedItem != null)
            {
                String seleccionTextBox1 = listBox1.SelectedItem.ToString();


                listBox2.Items.Add(seleccionTextBox1);

                listBox1.Items.Remove(seleccionTextBox1);


            }

        }

        private void BtnPasarTodos_Click(object sender, EventArgs e)
        {
            // Comprueba si hay elementos en la lista izquierda
            if (listBox1.Items.Count > 0)
            {
                // Transferimos los elementos de la lista izquierda a la lista derecha
                TransferirElementos(listBox1, listBox2);
                // Limpiar la lista izquierda
                listBox1.Items.Clear();
            }
            else
            {
                MessageBox.Show("No hay nombres en la lista izquierda para mover.");
            }
        }

        private void TransferirElementos(ListBox origen, ListBox destino)
        {
            // Nos movemos de atrás hacia adelante para evitar problemas al eliminar elementos
            for (int i = origen.Items.Count - 1; i >= 0; i--)
            {
                string nombre = origen.Items[i].ToString(); // Convertimos el elemento a string

                // Verificamos si el nombre ya existe en la lista destino, ignorando mayúsculas y minúsculas
                bool existe = destino.Items.Cast<string>().Any(n => n.Equals(nombre, StringComparison.OrdinalIgnoreCase));

                if (!existe)
                {
                    destino.Items.Add(nombre); // Agregamos el nombre si no está en la lista destino
                    origen.Items.RemoveAt(i);  // Eliminamos el nombre de la lista origen
                }
                else
                {
                    // Mostramos un mensaje si el nombre ya existe en la lista destino
                    MessageBox.Show($"El nombre {nombre} ya existe en la lista de la derecha.");
                }
            }
        }

        private void Ejercicio1_FormClosed(object sender, FormClosedEventArgs e)
        {
            FormPrincipal formPrincipal = new FormPrincipal(); // Crea una instancia del formulario principal
            formPrincipal.Show(); // Muestra el formulario principal
        }

        private void Ejercicio1_Load(object sender, EventArgs e)
        {

        }
    }
}      

