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
    public partial class FormPrincipal : Form
    {
        public FormPrincipal()
        {
            InitializeComponent();
        }

        private void btnEjercicio1_MouseEnter(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = Color.AliceBlue;
        }

        private void btnEjercicio1_MouseLeave(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = SystemColors.Control;
        }

        private void btnEjercicio2_MouseEnter(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = Color.AliceBlue;
        }

        private void btnEjercicio2_MouseLeave(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = SystemColors.Control;
        }

        private void btnEjercicio3_MouseEnter(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = Color.AliceBlue;
        }

        private void btnEjercicio3_MouseLeave(object sender, EventArgs e)
        {
            btnEjercicio1.BackColor = SystemColors.Control;
        }

        private void btnEjercicio1_Click(object sender, EventArgs e)
        {
            Ejercicio1 ejercicio1 = new Ejercicio1(this);
            ejercicio1.Show();
            this.Hide();
        }

        private void btnEjercicio2_Click(object sender, EventArgs e)
        {
            Ejercicio2 ejercicio2 = new Ejercicio2(this);
            ejercicio2.Show();
            this.Hide();
        }

        private void btnEjercicio3_Click(object sender, EventArgs e)
        {
            Ejercicio3 ejercicio3 = new Ejercicio3(this);
            ejercicio3.Show();
            this.Hide();
        }
    }
}
